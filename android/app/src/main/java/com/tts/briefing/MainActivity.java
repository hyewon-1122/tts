package com.tts.briefing;

import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static WebView sWebView;

    public static WebView getWebView() {
        return sWebView;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        sWebView = webView;

        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);

        // JavaScript Bridge
        webView.addJavascriptInterface(new NativeBridge(), "NativeBridge");

        // 에러 발생 시 커스텀 오프라인 페이지 로드
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    view.loadUrl("file:///android_asset/public/index.html");
                }
            }
        });

        // 백그라운드 오디오 서비스 시작
        Intent serviceIntent = new Intent(this, AudioService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    public static class NativeBridge {
        @JavascriptInterface
        public void updatePlayback(boolean playing, String title, String artist) {
            AudioService service = AudioService.getInstance();
            if (service != null) {
                service.updateFromWeb(playing, title, artist);
            }
        }
    }
}
