package com.melodyvault.service;

import com.melodyvault.dto.ListeningStatDto;
import com.melodyvault.model.ListeningStat;
import com.melodyvault.repository.ListeningStatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ListeningStatService {

    private final ListeningStatRepository statRepository;

    public ListeningStatService(ListeningStatRepository statRepository) {
        this.statRepository = statRepository;
    }

    @Transactional
    public void recordListen(ListeningStatDto dto) {
        ListeningStat stat = new ListeningStat(
                dto.getSongId(),
                dto.getSongTitle(),
                dto.getArtist(),
                dto.getGenre(),
                dto.getDurationSeconds(),
                dto.isCompleted()
        );
        statRepository.save(stat);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        long distinctSongs = statRepository.countDistinctSongsListened();
        long totalSeconds = statRepository.sumTotalListeningSeconds();
        List<ListeningStat> recentListens = statRepository.findTop50ByOrderByListenedAtDesc();
        List<ListeningStat> todayListens = statRepository.findByDateStringOrderByListenedAtDesc(LocalDate.now().toString());

        summary.put("distinctSongsListened", distinctSongs);
        summary.put("totalListeningMinutes", Math.round(totalSeconds / 60.0));
        summary.put("todaySessionCount", todayListens.size());
        summary.put("recentSessions", recentListens);
        return summary;
    }
}

