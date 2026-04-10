package com.tts.briefing;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

public class AudioService extends Service {
    private static final String CHANNEL_ID = "audio_playback";
    private static final int NOTIFICATION_ID = 1;
    public static final String ACTION_PLAY = "com.tts.briefing.PLAY";
    public static final String ACTION_PAUSE = "com.tts.briefing.PAUSE";
    public static final String ACTION_PREV = "com.tts.briefing.PREV";
    public static final String ACTION_STOP = "com.tts.briefing.STOP";
    public static final String ACTION_NEXT = "com.tts.briefing.NEXT";

    private MediaSessionCompat mediaSession;
    private boolean isPlaying = false;
    private String currentTitle = "머니터링 Pick";
    private String currentArtist = "";

    private static AudioService instance;

    public static AudioService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();

        mediaSession = new MediaSessionCompat(this, "MoneytorPick");
        mediaSession.setActive(true);
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                isPlaying = true;
                evaluateJs("window.__nativePlay && window.__nativePlay()");
                updateNotification();
            }

            @Override
            public void onPause() {
                isPlaying = false;
                evaluateJs("window.__nativePause && window.__nativePause()");
                updateNotification();
            }

            @Override
            public void onSkipToNext() {
                evaluateJs("window.__nativeNext && window.__nativeNext()");
            }

            @Override
            public void onSkipToPrevious() {
                evaluateJs("window.__nativePrev && window.__nativePrev()");
            }
        });

        updatePlaybackState();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case ACTION_PLAY:
                    mediaSession.getController().getTransportControls().play();
                    break;
                case ACTION_PAUSE:
                    mediaSession.getController().getTransportControls().pause();
                    break;
                case ACTION_NEXT:
                    mediaSession.getController().getTransportControls().skipToNext();
                    break;
                case ACTION_PREV:
                    mediaSession.getController().getTransportControls().skipToPrevious();
                    break;
                case ACTION_STOP:
                    evaluateJs("window.__nativePause && window.__nativePause()");
                    stopForeground(true);
                    stopSelf();
                    break;
            }
        }

        updateNotification();
        return START_STICKY;
    }

    /** WebView JavaScript에서 호출: 재생 상태 업데이트 */
    public void updateFromWeb(boolean playing, String title, String artist) {
        this.isPlaying = playing;
        this.currentTitle = title != null ? title : "머니터링 Pick";
        this.currentArtist = (artist != null && !artist.isEmpty()) ? artist : "머니터링 Pick";

        // 버그 3: 재생 중지 시 알림 닫기 가능하게
        if (!playing) {
            stopForeground(false); // 포그라운드 해제 (알림은 유지되지만 스와이프 삭제 가능)
        }
        updateNotification();
        updatePlaybackState();
        updateMetadata();
    }

    private void updateNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
            this, 0, openIntent, PendingIntent.FLAG_IMMUTABLE
        );

        // 이전 버튼
        Intent prevIntent = new Intent(this, AudioService.class);
        prevIntent.setAction(ACTION_PREV);
        PendingIntent prevPending = PendingIntent.getService(
            this, 1, prevIntent, PendingIntent.FLAG_IMMUTABLE
        );

        // 재생/일시정지 버튼
        Intent playPauseIntent = new Intent(this, AudioService.class);
        playPauseIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPausePending = PendingIntent.getService(
            this, 2, playPauseIntent, PendingIntent.FLAG_IMMUTABLE
        );

        // 다음 버튼
        Intent nextIntent = new Intent(this, AudioService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPending = PendingIntent.getService(
            this, 3, nextIntent, PendingIntent.FLAG_IMMUTABLE
        );

        // 닫기 버튼
        Intent stopIntent = new Intent(this, AudioService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(
            this, 4, stopIntent, PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(openPending)
            .setOngoing(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setDeleteIntent(stopPending)
            .addAction(R.drawable.ic_launcher_background, "이전", prevPending)         // 0
            .addAction(                                                                 // 1
                R.drawable.ic_launcher_background,
                isPlaying ? "일시정지" : "재생",
                playPausePending
            )
            .addAction(R.drawable.ic_launcher_background, "다음", nextPending)         // 2
            .addAction(R.drawable.ic_launcher_background, "닫기", stopPending)         // 3
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
                .setShowCancelButton(true)
                .setCancelButtonIntent(stopPending)
            );

        Notification notification = builder.build();
        startForeground(NOTIFICATION_ID, notification);
    }

    private void updatePlaybackState() {
        long actions = PlaybackStateCompat.ACTION_PLAY
            | PlaybackStateCompat.ACTION_PAUSE
            | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
            | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS;

        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(
                isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                1.0f
            )
            .build();
        mediaSession.setPlaybackState(state);
    }

    private void updateMetadata() {
        MediaMetadataCompat metadata = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "머니터링 Pick")
            .build();
        mediaSession.setMetadata(metadata);
    }

    private void evaluateJs(String js) {
        if (MainActivity.getWebView() != null) {
            MainActivity.getWebView().post(() ->
                MainActivity.getWebView().evaluateJavascript(js, null)
            );
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        instance = null;
        super.onDestroy();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "오디오 재생",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("백그라운드 오디오 재생");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}
