package fivechan.android;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private static final String TAG = "AppUpdaterPlugin";
    private static final String EMULATOR_HOST = "10.0.2.2";

    @PluginMethod
    public void downloadAndInstallUpdate(PluginCall call) {
        final String url = sanitizeUrl(call.getString("url"));
        final String fileName = sanitizeFileName(call.getString("fileName"));

        if (url == null) {
            call.reject("Update url is required");
            return;
        }

        new Thread(
                        () -> {
                            try {
                                File apkFile = downloadApk(url, fileName);
                                Activity activity = getActivity();
                                if (activity == null) {
                                    call.reject("Activity unavailable");
                                    return;
                                }

                                activity.runOnUiThread(() -> openInstaller(call, activity, apkFile));
                            } catch (Exception e) {
                                Log.e(TAG, "Failed to download update", e);
                                call.reject("Failed to download update: " + e.getMessage(), e);
                            }
                        })
                .start();
    }

    private boolean isDebugBuild() {
        return (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    private String sanitizeUrl(String value) {
        if (value == null) {
            return null;
        }

        String sanitized = value.trim();
        Uri uri = Uri.parse(sanitized);
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if (scheme == null || host == null) {
            return null;
        }

        String normalizedScheme = scheme.toLowerCase();
        String normalizedHost = host.toLowerCase();

        if ("https".equals(normalizedScheme) && "github.com".equals(normalizedHost)) {
            return sanitized;
        }

        if (isDebugBuild()
                && ("http".equals(normalizedScheme) || "https".equals(normalizedScheme))
                && (EMULATOR_HOST.equals(normalizedHost)
                        || "127.0.0.1".equals(normalizedHost)
                        || "localhost".equals(normalizedHost))) {
            return sanitized;
        }

        return null;
    }

    private String sanitizeFileName(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "5chan-update.apk";
        }

        String sanitized = value.trim().replace("\\", "/");
        int slashIndex = sanitized.lastIndexOf('/');
        String fileName = slashIndex >= 0 ? sanitized.substring(slashIndex + 1) : sanitized;
        return fileName.toLowerCase().endsWith(".apk") ? fileName : fileName + ".apk";
    }

    private File downloadApk(String url, String fileName) throws IOException {
        File updatesDirectory = new File(getContext().getCacheDir(), "app-updates");
        if (!updatesDirectory.exists() && !updatesDirectory.mkdirs()) {
            throw new IOException("Could not create update directory");
        }

        File apkFile = new File(updatesDirectory, fileName);
        File tempFile = new File(updatesDirectory, fileName + ".download");
        if (tempFile.exists() && !tempFile.delete()) {
            throw new IOException("Could not replace pending update download");
        }

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(url).build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new IOException("Unexpected response " + response.code());
            }

            try (InputStream inputStream = response.body().byteStream();
                    OutputStream outputStream = new java.io.FileOutputStream(tempFile)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, read);
                }
            }
        }

        if (apkFile.exists() && !apkFile.delete()) {
            throw new IOException("Could not replace existing update package");
        }

        if (!tempFile.renameTo(apkFile)) {
            throw new IOException("Could not finalize update package");
        }

        return apkFile;
    }

    private void openInstaller(PluginCall call, Activity activity, File apkFile) {
        PackageManager packageManager = activity.getPackageManager();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + activity.getPackageName()));
            settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(settingsIntent);
            call.reject("Allow app installs for 5chan, then tap update again.");
            return;
        }

        Uri apkUri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", apkFile);
        Intent installIntent = new Intent(Intent.ACTION_VIEW);
        installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        try {
            activity.startActivity(installIntent);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to open installer", e);
            call.reject("Failed to open installer: " + e.getMessage(), e);
        }
    }
}
