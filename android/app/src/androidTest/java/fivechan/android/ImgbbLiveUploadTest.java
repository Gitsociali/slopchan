package fivechan.android;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import androidx.core.content.FileProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Live provider integration test (emulator/device) for Android's ImgBB WebView uploader. */
@RunWith(AndroidJUnit4.class)
public class ImgbbLiveUploadTest {
    private static final long TEST_TIMEOUT_SEC = 120;
    private static final String GENERATED_FILE_NAME = "imgbb-gradient-320x320.png";

    private Context appContext;
    private Uri uploadUri;

    @Before
    public void setUp() throws Exception {
        appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        uploadUri = createGradientPngUri(appContext);
    }

    @Test
    public void imgbb_liveUpload_fromGeneratedPng_succeeds() throws Exception {
        Intent launchIntent = new Intent(appContext, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        appContext.startActivity(launchIntent);
        Thread.sleep(1_000);

        AtomicReference<MediaUploadResult> resultRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        MediaUploadCallback callback =
                result -> {
                    resultRef.set(result);
                    latch.countDown();
                };

        MediaUploadAutomationRunner runner =
                new MediaUploadAutomationRunner(
                        appContext,
                        uploadUri,
                        GENERATED_FILE_NAME,
                        MediaUploadRecipes.PROVIDER_IMGBB,
                        callback);

        runner.run();

        assertTrue(
                "Runner did not complete within " + TEST_TIMEOUT_SEC + "s",
                latch.await(TEST_TIMEOUT_SEC, TimeUnit.SECONDS));

        MediaUploadResult result = resultRef.get();
        assertNotNull("Callback did not receive result", result);
        assertTrue(
                "Expected live imgbb upload success, got error="
                        + result.error
                        + " stage="
                        + result.stage
                        + " elapsedMs="
                        + result.elapsedMs
                        + " selector="
                        + result.matchedSelectors
                        + " retries="
                        + result.triggerRetryCount,
                result.success);
        assertNotNull("Expected uploaded URL", result.url);
        String normalizedUrl = result.url.toLowerCase();
        assertTrue(
                "Expected direct i.ibb.co URL, got: " + result.url,
                normalizedUrl.contains("://i.ibb.co/"));
        assertTrue(
                "Expected direct image URL with extension, got: " + result.url,
                normalizedUrl.matches(
                        "https?://i\\.ibb\\.co/.+\\.(jpg|jpeg|png|gif|webp|bmp|avif)(?:[?#].*)?"));
    }

    private static Uri createGradientPngUri(Context context) throws IOException {
        File dir = new File(context.getCacheDir(), "live-upload-test");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Unable to create cache directory: " + dir.getAbsolutePath());
        }

        File imageFile = new File(dir, GENERATED_FILE_NAME);
        Bitmap bitmap = Bitmap.createBitmap(320, 320, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint();
        for (int y = 0; y < 320; y++) {
            int red = Math.round((255f * y) / 319f);
            int blue = 255 - red;
            paint.setColor(Color.rgb(red, 64, blue));
            canvas.drawLine(0, y, 319, y, paint);
        }
        try (FileOutputStream fos = new FileOutputStream(imageFile)) {
            if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos)) {
                throw new IOException("Failed to encode generated PNG");
            }
        } finally {
            bitmap.recycle();
        }

        return FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                imageFile);
    }
}
