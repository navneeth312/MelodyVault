package com.melodyvault.repository;

import com.melodyvault.model.XpTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransaction, String> {

    List<XpTransaction> findAllByOrderByTimestampDesc();

    List<XpTransaction> findByDayDateOrderByTimestampDesc(String dayDate);

    @Query("SELECT COALESCE(SUM(x.amount), 0) FROM XpTransaction x")
    int sumTotalXp();

    @Query("SELECT COALESCE(SUM(x.amount), 0) FROM XpTransaction x WHERE x.dayDate = :dayDate AND x.source IN ('first_listen', 'listening')")
    int sumDailyListeningXp(@Param("dayDate") String dayDate);
}

