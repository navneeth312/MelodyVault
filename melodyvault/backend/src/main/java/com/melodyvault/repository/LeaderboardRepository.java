package com.melodyvault.repository;

import com.melodyvault.model.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardRepository extends JpaRepository<LeaderboardEntry, String> {
    List<LeaderboardEntry> findByOptedInTrueOrderByTotalXpDesc();
    Optional<LeaderboardEntry> findByUserId(String userId);
}

