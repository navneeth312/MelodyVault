package com.melodyvault.repository;

import com.melodyvault.model.CatalogueTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogueTrackRepository extends JpaRepository<CatalogueTrack, String> {

    List<CatalogueTrack> findByGenreIgnoreCase(String genre);

    List<CatalogueTrack> findByLanguageIgnoreCase(String language);

    @Query("SELECT t FROM CatalogueTrack t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.artist) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.album) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.genre) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CatalogueTrack> searchTracks(@Param("query") String query);

    List<CatalogueTrack> findByIsPlayableTrueOrderByPlayCountDesc();
}

