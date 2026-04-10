package com.tts.briefing;

import android.content.Intent;
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

    // 버그 1: 백버튼 → 재생화면 닫기 (앱 종료 대신 JS로 처리)
    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // JS에서 확장 플레이어가 열려있으면 닫기
            webView.evaluateJavascript(
                "(function() { " +
                "  if (window.__closeExpandedPlayer) { " +
                "    var closed = window.__closeExpandedPlayer(); " +
                "    return closed ? 'closed' : 'none'; " +
                "  } " +
                "  return 'none'; " +
                "})()",
                result -> {
                    if (result != null && result.contains("closed")) {
                        // 재생화면 닫힘 — 아무것도 안 함
                    } else {
                        // 재생화면이 안 열려있으면 기본 동작 (앱 백그라운드)
                        moveTaskToBack(true);
                    }
                }
            );
        } else {
            moveTaskToBack(true);
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
