package com.melodyvault.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class LocalMusicScannerService {

    private static final Logger log = LoggerFactory.getLogger(LocalMusicScannerService.class);

    public static final String DEFAULT_MUSIC_DIR = "public/demo-music";
    public static final String LEGACY_MUSIC_DIR = "C:\\MelodyVault Sample Music";

    private final File musicDirectory;

    public LocalMusicScannerService(
            @Value("${melodyvault.music.directory:#{null}}") String configuredPath) {
        this.musicDirectory = resolveMusicDirectory(configuredPath);
        log.info("Initialized LocalMusicScannerService with music directory: {}", this.musicDirectory.getAbsolutePath());
    }

    public LocalMusicScannerService(File customDirectory) {
        this.musicDirectory = customDirectory != null ? customDirectory : resolveMusicDirectory(null);
    }

    public LocalMusicScannerService() {
        this((String) null);
    }

    /**
     * Resolves the music directory portably and consistently:
     * 1. MUSIC_LIBRARY_DIR environment variable override
     * 2. melodyvault.music.directory Spring property
     * 3. public/demo-music relative to working directory (repo root)
     * 4. ../public/demo-music (when started from backend directory)
     * 5. C:\MelodyVault Sample Music (host legacy Windows fallback)
     */
    public static File resolveMusicDirectory(String configuredPath) {
        // 1. Environment variable override: MUSIC_LIBRARY_DIR
        String envDir = System.getenv("MUSIC_LIBRARY_DIR");
        if (envDir != null && !envDir.trim().isEmpty()) {
            File dir = new File(envDir.trim());
            if (dir.exists() && dir.isDirectory()) {
                log.info("Resolved music directory from MUSIC_LIBRARY_DIR env: {}", dir.getAbsolutePath());
                return dir;
            }
            log.warn("MUSIC_LIBRARY_DIR is set to '{}' but directory does not exist on disk.", envDir);
            return dir;
        }

        // 2. Configured property: melodyvault.music.directory
        if (configuredPath != null && !configuredPath.trim().isEmpty()) {
            File dir = new File(configuredPath.trim());
            if (dir.exists() && dir.isDirectory()) {
                log.info("Resolved music directory from configured property: {}", dir.getAbsolutePath());
                return dir;
            }
            // Check relative from parent directory if started from backend subdirectory
            File fromParent = new File("..", configuredPath.trim());
            if (fromParent.exists() && fromParent.isDirectory()) {
                log.info("Resolved music directory from parent path: {}", fromParent.getAbsolutePath());
                return fromParent;
            }
        }

        // 3. Repository default: public/demo-music (when started from repository root)
        File fromRoot = new File("public", "demo-music");
        if (fromRoot.exists() && fromRoot.isDirectory()) {
            log.info("Resolved repository demo music directory: {}", fromRoot.getAbsolutePath());
            return fromRoot;
        }

        // 4. Repository default from backend subdirectory: ../public/demo-music
        File fromBackend = new File("..", "public/demo-music");
        if (fromBackend.exists() && fromBackend.isDirectory()) {
            log.info("Resolved repository demo music directory from backend: {}", fromBackend.getAbsolutePath());
            return fromBackend;
        }

        // 5. Host legacy Windows directory fallback: C:\MelodyVault Sample Music
        File legacy = new File(LEGACY_MUSIC_DIR);
        if (legacy.exists() && legacy.isDirectory()) {
            log.info("Resolved host legacy music directory: {}", legacy.getAbsolutePath());
            return legacy;
        }

        // 6. Default fallback
        log.warn("No existing music directory discovered; defaulting to: {}", fromRoot.getAbsolutePath());
        return fromRoot;
    }

    public File getMusicDirectory() {
        return this.musicDirectory;
    }

    public String getMusicDirectoryPath() {
        return this.musicDirectory.getAbsolutePath();
    }

    public static class DiscoveredTrackDto {
        private String id;
        private String filename;
        private String title;
        private String artist;
        private String album;
        private String genre;
        private String language;
        private int duration;
        private int year;
        private long fileSize;
        private boolean hasArtwork;
        private String audioUrl;
        private String artworkUrl;
        private String format;
        private int bitrateKbps;
        private String albumArtist;
        private int trackNumber;

        public DiscoveredTrackDto() {}

        public DiscoveredTrackDto(String id, String filename, String title, String artist, String album,
                                  String genre, String language, int duration, int year, long fileSize,
                                  boolean hasArtwork, String audioUrl, String artworkUrl, String format,
                                  int bitrateKbps, String albumArtist, int trackNumber) {
            this.id = id;
            this.filename = filename;
            this.title = title;
            this.artist = artist;
            this.album = album;
            this.genre = genre;
            this.language = language;
            this.duration = duration;
            this.year = year;
            this.fileSize = fileSize;
            this.hasArtwork = hasArtwork;
            this.audioUrl = audioUrl;
            this.artworkUrl = artworkUrl;
            this.format = format;
            this.bitrateKbps = bitrateKbps;
            this.albumArtist = albumArtist;
            this.trackNumber = trackNumber;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getArtist() { return artist; }
        public void setArtist(String artist) { this.artist = artist; }
        public String getAlbum() { return album; }
        public void setAlbum(String album) { this.album = album; }
        public String getGenre() { return genre; }
        public void setGenre(String genre) { this.genre = genre; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public int getDuration() { return duration; }
        public void setDuration(int duration) { this.duration = duration; }
        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
        public boolean isHasArtwork() { return hasArtwork; }
        public void setHasArtwork(boolean hasArtwork) { this.hasArtwork = hasArtwork; }
        public String getAudioUrl() { return audioUrl; }
        public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
        public String getArtworkUrl() { return artworkUrl; }
        public void setArtworkUrl(String artworkUrl) { this.artworkUrl = artworkUrl; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public int getBitrateKbps() { return bitrateKbps; }
        public void setBitrateKbps(int bitrateKbps) { this.bitrateKbps = bitrateKbps; }
        public String getAlbumArtist() { return albumArtist; }
        public void setAlbumArtist(String albumArtist) { this.albumArtist = albumArtist; }
        public int getTrackNumber() { return trackNumber; }
        public void setTrackNumber(int trackNumber) { this.trackNumber = trackNumber; }
    }

    public static class ExtractedArtwork {
        private final String mimeType;
        private final byte[] data;

        public ExtractedArtwork(String mimeType, byte[] data) {
            this.mimeType = mimeType;
            this.data = data;
        }

        public String getMimeType() { return mimeType; }
        public byte[] getData() { return data; }
    }

    /**
     * Recursively scans the resolved music directory for all valid audio tracks.
     */
    public List<DiscoveredTrackDto> scanSampleMusicFolder() {
        return scanDirectory(this.musicDirectory);
    }

    public List<DiscoveredTrackDto> scanDirectory(File dir) {
        List<DiscoveredTrackDto> list = new ArrayList<>();
        if (!dir.exists() || !dir.isDirectory()) {
            log.warn("Sample music folder does not exist: {}", dir.getAbsolutePath());
            return list;
        }

        File[] files = dir.listFiles();
        if (files == null) return list;

        for (File file : files) {
            if (file.isDirectory()) {
                list.addAll(scanDirectory(file));
            } else if (isSupportedAudioFile(file.getName())) {
                try {
                    DiscoveredTrackDto dto = parseAudioFile(file);
                    if (dto != null) list.add(dto);
                } catch (Exception e) {
                    log.error("Failed to parse audio file: {}", file.getName(), e);
                }
            }
        }
        return list;
    }

    private boolean isSupportedAudioFile(String name) {
        String lower = name.toLowerCase();
        return lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".flac") || lower.endsWith(".m4a");
    }

    public DiscoveredTrackDto parseAudioFile(File file) {
        String filename = file.getName();
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        String id = "local-" + Math.abs(filename.hashCode());

        String title = filename.substring(0, filename.lastIndexOf('.')).trim();
        String artist = "Unknown Artist";
        String album = "MelodyVault Collection";
        String genre = "Soundtrack";
        String language = "Multilingual";
        int year = 2024;
        int duration = 210; // Default estimate
        boolean hasArtwork = false;
        String albumArtist = "Unknown Artist";
        int trackNumber = 1;

        // Extract ID3 tags for MP3
        if (ext.equals("mp3")) {
            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] header = new byte[10];
                if (fis.read(header) == 10 && header[0] == 'I' && header[1] == 'D' && header[2] == '3') {
                    int tagSize = ((header[6] & 0x7f) << 21) | ((header[7] & 0x7f) << 14)
                            | ((header[8] & 0x7f) << 7) | (header[9] & 0x7f);

                    byte[] tagBuffer = new byte[tagSize];
                    int readBytes = fis.read(tagBuffer);

                    if (readBytes > 0) {
                        Map<String, String> frames = parseId3Frames(tagBuffer);
                        if (frames.containsKey("TIT2") && !frames.get("TIT2").isEmpty()) {
                            title = cleanMetadataString(frames.get("TIT2"));
                        }
                        if (frames.containsKey("TPE1") && !frames.get("TPE1").isEmpty()) {
                            artist = cleanMetadataString(frames.get("TPE1"));
                        }
                        if (frames.containsKey("TPE2") && !frames.get("TPE2").isEmpty()) {
                            albumArtist = cleanMetadataString(frames.get("TPE2"));
                        }
                        if (frames.containsKey("TALB") && !frames.get("TALB").isEmpty()) {
                            album = cleanMetadataString(frames.get("TALB"));
                        }
                        if (frames.containsKey("TCON") && !frames.get("TCON").isEmpty()) {
                            genre = cleanMetadataString(frames.get("TCON"));
                        }
                        if (frames.containsKey("TYER") && !frames.get("TYER").isEmpty()) {
                            try {
                                year = Integer.parseInt(frames.get("TYER").trim());
                            } catch (Exception ignored) {}
                        }
                        if (frames.containsKey("TRCK") && !frames.get("TRCK").isEmpty()) {
                            try {
                                String trck = frames.get("TRCK").trim();
                                if (trck.contains("/")) trck = trck.split("/")[0];
                                trackNumber = Integer.parseInt(trck);
                            } catch (Exception ignored) {}
                        }

                        hasArtwork = hasId3Artwork(tagBuffer);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not read ID3 metadata from {}: {}", filename, e.getMessage());
            }
        }

        // Duration calculation from MP3 bitrate
        if (ext.equals("mp3") && file.length() > 0) {
            duration = Math.max(30, (int) (file.length() / (128 * 1024 / 8)));
        }

        int bitrateKbps = 320;
        if (file.length() > 0 && duration > 0) {
            bitrateKbps = (int) Math.round(((double) file.length() * 8) / (duration * 1000));
            if (bitrateKbps < 64) bitrateKbps = 128;
            if (bitrateKbps > 320) bitrateKbps = 320;
        }

        String audioUrl = "/api/local-collection/audio/" + java.net.URLEncoder.encode(filename, StandardCharsets.UTF_8);
        String artworkUrl = hasArtwork
                ? "/api/local-collection/artwork/" + java.net.URLEncoder.encode(filename, StandardCharsets.UTF_8)
                : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80";

        return new DiscoveredTrackDto(
                id, filename, title, artist, album, genre, language, duration, year,
                file.length(), hasArtwork, audioUrl, artworkUrl, ext.toUpperCase(),
                bitrateKbps, albumArtist, trackNumber
        );
    }

    private String cleanMetadataString(String s) {
        if (s == null) return "";
        return s.replace("\0", "").trim();
    }

    private Map<String, String> parseId3Frames(byte[] buffer) {
        Map<String, String> map = new HashMap<>();
        int pos = 0;
        while (pos + 10 < buffer.length) {
            String frameId = new String(buffer, pos, 4, StandardCharsets.ISO_8859_1);
            if (!frameId.matches("^[A-Z0-9]{4}$")) break;

            int frameSize = ((buffer[pos+4] & 0xFF) << 24) | ((buffer[pos+5] & 0xFF) << 16)
                    | ((buffer[pos+6] & 0xFF) << 8) | (buffer[pos+7] & 0xFF);
            pos += 10;

            if (frameSize <= 0 || pos + frameSize > buffer.length) break;

            if (frameId.startsWith("T") && !frameId.equals("TXXX")) {
                int enc = buffer[pos];
                String text = "";
                int dataLen = frameSize - 1;
                if (dataLen > 0) {
                    if (enc == 0) text = new String(buffer, pos + 1, dataLen, StandardCharsets.ISO_8859_1);
                    else if (enc == 1) text = new String(buffer, pos + 1, dataLen, StandardCharsets.UTF_16LE);
                    else if (enc == 3) text = new String(buffer, pos + 1, dataLen, StandardCharsets.UTF_8);
                }
                map.put(frameId, text);
            }
            pos += frameSize;
        }
        return map;
    }

    private boolean hasId3Artwork(byte[] buffer) {
        int pos = 0;
        while (pos + 10 < buffer.length) {
            String frameId = new String(buffer, pos, 4, StandardCharsets.ISO_8859_1);
            if (!frameId.matches("^[A-Z0-9]{4}$")) break;

            int frameSize = ((buffer[pos+4] & 0xFF) << 24) | ((buffer[pos+5] & 0xFF) << 16)
                    | ((buffer[pos+6] & 0xFF) << 8) | (buffer[pos+7] & 0xFF);
            pos += 10;
            if (frameSize <= 0 || pos + frameSize > buffer.length) break;

            if (frameId.equals("APIC")) return true;
            pos += frameSize;
        }
        return false;
    }

    public ExtractedArtwork extractArtwork(String filename) throws IOException {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        File baseDir = this.musicDirectory.getCanonicalFile();
        File file = new File(baseDir, filename).getCanonicalFile();
        if (!file.toPath().startsWith(baseDir.toPath()) || !file.exists() || !file.isFile()) {
            return null;
        }

        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] header = new byte[10];
            if (fis.read(header) != 10 || header[0] != 'I' || header[1] != 'D' || header[2] != '3') {
                return null;
            }

            int tagSize = ((header[6] & 0x7f) << 21) | ((header[7] & 0x7f) << 14)
                    | ((header[8] & 0x7f) << 7) | (header[9] & 0x7f);

            byte[] tagBuffer = new byte[tagSize];
            int readBytes = fis.read(tagBuffer);
            if (readBytes <= 0) return null;

            int pos = 0;
            while (pos + 10 < tagBuffer.length) {
                String frameId = new String(tagBuffer, pos, 4, StandardCharsets.ISO_8859_1);
                if (!frameId.matches("^[A-Z0-9]{4}$")) break;

                int frameSize = ((tagBuffer[pos+4] & 0xFF) << 24) | ((tagBuffer[pos+5] & 0xFF) << 16)
                        | ((tagBuffer[pos+6] & 0xFF) << 8) | (tagBuffer[pos+7] & 0xFF);
                pos += 10;
                if (frameSize <= 0 || pos + frameSize > tagBuffer.length) break;

                if (frameId.equals("APIC")) {
                    int encoding = tagBuffer[pos];
                    int offset = pos + 1;
                    StringBuilder mimeBuilder = new StringBuilder();
                    while (offset < pos + frameSize && tagBuffer[offset] != 0) {
                        mimeBuilder.append((char) tagBuffer[offset]);
                        offset++;
                    }
                    offset++; // skip null
                    offset++; // skip picture type (front cover = 3)

                    // Skip description
                    if (encoding == 0 || encoding == 3) {
                        while (offset < pos + frameSize && tagBuffer[offset] != 0) offset++;
                        offset++;
                    } else {
                        while (offset < pos + frameSize - 1 && !(tagBuffer[offset] == 0 && tagBuffer[offset+1] == 0)) {
                            offset += 2;
                        }
                        offset += 2;
                    }

                    int imgLen = (pos + frameSize) - offset;
                    if (imgLen > 0) {
                        byte[] imgBytes = Arrays.copyOfRange(tagBuffer, offset, offset + imgLen);
                        String mime = mimeBuilder.toString().trim();
                        if (mime.isEmpty()) mime = "image/png";
                        return new ExtractedArtwork(mime, imgBytes);
                    }
                }
                pos += frameSize;
            }
        }
        return null;
    }

    public File getAudioFile(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        try {
            File baseDir = this.musicDirectory.getCanonicalFile();
            File file = new File(baseDir, filename).getCanonicalFile();
            if (file.toPath().startsWith(baseDir.toPath()) && file.exists() && file.isFile() && isSupportedAudioFile(file.getName())) {
                return file;
            }
        } catch (IOException e) {
            log.warn("Error validating audio file path: {}", e.getMessage());
        }
        return null;
    }

    public Map<String, Object> getScannerStatus() {
        boolean exists = this.musicDirectory.exists() && this.musicDirectory.isDirectory();
        int count = exists ? scanSampleMusicFolder().size() : 0;

        Map<String, Object> status = new HashMap<>();
        status.put("configuredFolder", this.musicDirectory.getAbsolutePath());
        status.put("folderExists", exists);
        status.put("trackCount", count);
        status.put("isScanning", false);
        return status;
    }
}
