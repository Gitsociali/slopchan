package fivechan.android;

import static org.junit.Assert.*;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import androidx.core.content.FileProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Live provider integration test (emulator/device) for Android's native catbox uploader. */
@RunWith(AndroidJUnit4.class)
public class CatboxLiveUploadTest {
    private static final long TEST_TIMEOUT_SEC = 30;
    private static final String GENERATED_FILE_NAME = "catbox-gradient-320x320.png";

    private Context appContext;
    private Uri uploadUri;

    @Before
    public void setUp() throws Exception {
        appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        uploadUri = createGradientPngUri(appContext);
    }

    @Test
    public void catbox_liveUpload_fromGeneratedPng_succeeds() {
        MediaUploadResult result = CatboxUploader.upload(appContext, uploadUri, TEST_TIMEOUT_SEC);

        assertNotNull("Expected catbox result", result);
        assertTrue("Expected catbox upload success, got: " + result.error, result.success);
        assertNotNull("Expected uploaded URL", result.url);
        String normalizedUrl = result.url.toLowerCase();
        assertTrue(
                "Expected catbox file URL, got: " + result.url,
                normalizedUrl.matches("https?://files\\.catbox\\.moe/.+\\.(png|jpg|jpeg|webp|gif)(?:[?#].*)?"));
    }

    private static Uri createGradientPngUri(Context context) throws IOException {
        File dir = new File(context.getCacheDir(), "live-upload-test");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Unable to create cache directory: " + dir.getAbsolutePath());
        }

        File imageFile = new File(dir, GENERATED_FILE_NAME);
        Bitmap bitmap = Bitmap.createBitmap(320, 320, Bitmap.Config.ARGB_8888);
        for (int y = 0; y < 320; y++) {
            for (int x = 0; x < 320; x++) {
                bitmap.setPixel(
                        x,
                        y,
                        Color.rgb((x * 7) % 256, (y * 5) % 256, ((x + y) * 3) % 256));
            }
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
