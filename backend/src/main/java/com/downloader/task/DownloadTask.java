package com.downloader.task;

public interface DownloadTask extends Runnable {
    void pause();

    void cleanup();
}
