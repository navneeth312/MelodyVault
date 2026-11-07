package com.melodyvault.repository;

import com.melodyvault.model.CreatorSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface CreatorSessionRepository extends JpaRepository<CreatorSession, Long> {

    Optional<CreatorSession> findByTokenHash(String tokenHash);

    @Transactional
    @Modifying
    @Query("UPDATE CreatorSession s SET s.revoked = true WHERE s.revoked = false")
    int revokeAllActiveSessions();

    @Transactional
    @Modifying
    @Query("DELETE FROM CreatorSession s WHERE s.expiresAt < :cutoff")
    int deleteExpiredSessions(@Param("cutoff") Instant cutoff);
}

