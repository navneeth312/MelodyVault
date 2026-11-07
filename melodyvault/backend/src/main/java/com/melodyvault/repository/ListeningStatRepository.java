package com.melodyvault.repository;

import com.melodyvault.model.ListeningStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListeningStatRepository extends JpaRepository<ListeningStat, Long> {

    List<ListeningStat> findByDateStringOrderByListenedAtDesc(String dateString);

    List<ListeningStat> findTop50ByOrderByListenedAtDesc();

    @Query("SELECT COUNT(DISTINCT s.songId) FROM ListeningStat s")
    long countDistinctSongsListened();

    @Query("SELECT COALESCE(SUM(s.durationSeconds), 0) FROM ListeningStat s")
    long sumTotalListeningSeconds();
}

