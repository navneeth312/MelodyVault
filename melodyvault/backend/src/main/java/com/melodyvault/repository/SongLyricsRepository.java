package com.melodyvault.repository;

import com.melodyvault.model.SongLyrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SongLyricsRepository extends JpaRepository<SongLyrics, Long> {
    Optional<SongLyrics> findBySongId(String songId);
    Optional<SongLyrics> findByTitleIgnoreCaseAndArtistIgnoreCase(String title, String artist);
}

