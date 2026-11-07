export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  duration: number;
  artworkDataUrl?: string;
  artworkBlob?: Blob;
}

export function parseFilenameMetadata(filename: string): { title: string; artist: string } {
  // Strip extension
  const baseName = filename.replace(/\.(mp3|wav|wave|m4a|ogg|flac)$/i, '').trim();

  // Check for common patterns: "Artist - Title", "01 - Artist - Title", "01 - Title", "Artist_-_Title"
  const cleanName = baseName.replace(/_/g, ' ');

  // Split on " - "
  const parts = cleanName.split(/\s*-\s*/);

  if (parts.length >= 2) {
    // If first part is a track number like "01" or "02"
    if (/^\d+$/.test(parts[0].trim())) {
      if (parts.length >= 3) {
        return {
          artist: parts[1].trim(),
          title: parts.slice(2).join(' - ').trim(),
        };
      }
      return {
        artist: 'Unknown Artist',
        title: parts.slice(1).join(' - ').trim(),
      };
    }
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }

  // Remove leading track number e.g. "01. Song Name" or "01 Song Name"
  const titleWithoutNum = cleanName.replace(/^\d+[\.\s_-]+/, '').trim();
  return {
    artist: 'Unknown Artist',
    title: titleWithoutNum || cleanName,
  };
}

// Decode text from bytes based on ID3 encoding byte
function decodeID3Text(bytes: Uint8Array, encodingByte: number): string {
  try {
    if (encodingByte === 0) {
      // ISO-8859-1 (Latin1)
      const decoder = new TextDecoder('iso-8859-1');
      return decoder.decode(bytes).replace(/\0+$/, '').trim();
    } else if (encodingByte === 1) {
      // UTF-16 with BOM
      const decoder = new TextDecoder('utf-16');
      return decoder.decode(bytes).replace(/\0+$/, '').trim();
    } else if (encodingByte === 2) {
      // UTF-16BE without BOM
      const decoder = new TextDecoder('utf-16be');
      return decoder.decode(bytes).replace(/\0+$/, '').trim();
    } else if (encodingByte === 3) {
      // UTF-8
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes).replace(/\0+$/, '').trim();
    }
  } catch {
    // fallback
  }
  // Fallback simple ascii
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > 0) str += String.fromCharCode(bytes[i]);
  }
  return str.trim();
}

// ID3v2 Syncsafe integer decoder
function decodeSyncSafeInt(b0: number, b1: number, b2: number, b3: number): number {
  return ((b0 & 0x7f) << 21) | ((b1 & 0x7f) << 14) | ((b2 & 0x7f) << 7) | (b3 & 0x7f);
}

// Parse ID3v2 Tags from ArrayBuffer
export function parseID3v2(buffer: ArrayBuffer): Partial<ParsedAudioMetadata> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return {};

  // Check 'ID3' header
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return {};
  }

  const version = bytes[3]; // 3 for ID3v2.3, 4 for ID3v2.4
  const tagSize = decodeSyncSafeInt(bytes[6], bytes[7], bytes[8], bytes[9]);
  const maxOffset = Math.min(bytes.length, 10 + tagSize);

  const result: Partial<ParsedAudioMetadata> = {};
  let offset = 10;

  while (offset + 10 < maxOffset) {
    // Read 4-character frame ID
    let frameId = '';
    for (let i = 0; i < 4; i++) {
      const c = bytes[offset + i];
      if (c >= 32 && c <= 126) {
        frameId += String.fromCharCode(c);
      }
    }

    if (frameId.length < 4 || frameId.charCodeAt(0) === 0) {
      break; // Padding reached
    }

    let frameSize = 0;
    if (version === 4) {
      frameSize = decodeSyncSafeInt(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );
    } else {
      frameSize =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
    }

    if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) {
      break;
    }

    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

    if (frameData.length > 1) {
      const encoding = frameData[0];
      const payload = frameData.subarray(1);

      if (frameId === 'TIT2') {
        result.title = decodeID3Text(payload, encoding);
      } else if (frameId === 'TPE1') {
        result.artist = decodeID3Text(payload, encoding);
      } else if (frameId === 'TALB') {
        result.album = decodeID3Text(payload, encoding);
      } else if (frameId === 'TCON') {
        result.genre = decodeID3Text(payload, encoding).replace(/^\(\d+\)/, ''); // Remove numeric genre code
      } else if (frameId === 'TYER' || frameId === 'TDRC') {
        const yrStr = decodeID3Text(payload, encoding);
        const yr = parseInt(yrStr, 10);
        if (!isNaN(yr)) result.year = yr;
      } else if (frameId === 'APIC') {
        // Attached Picture
        try {
          // Parse MIME type (null-terminated ascii)
          let mimeEnd = 0;
          while (mimeEnd < payload.length && payload[mimeEnd] !== 0) {
            mimeEnd++;
          }
          const mimeType =
            new TextDecoder('iso-8859-1').decode(payload.subarray(0, mimeEnd)) || 'image/jpeg';
          let imgStart = mimeEnd + 1;

          // Picture type (1 byte)
          imgStart += 1;

          // Description (null-terminated string based on encoding)
          if (encoding === 0 || encoding === 3) {
            while (imgStart < payload.length && payload[imgStart] !== 0) {
              imgStart++;
            }
            imgStart += 1;
          } else {
            // UTF-16 double null
            while (
              imgStart + 1 < payload.length &&
              (payload[imgStart] !== 0 || payload[imgStart + 1] !== 0)
            ) {
              imgStart += 2;
            }
            imgStart += 2;
          }

          if (imgStart < payload.length) {
            const imgBytes = payload.subarray(imgStart);
            const blob = new Blob([imgBytes], { type: mimeType });
            result.artworkBlob = blob;
          }
        } catch (e) {
          console.warn('APIC parse error:', e);
        }
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

// Parse WAV RIFF INFO metadata chunks
export function parseWAVInfo(buffer: ArrayBuffer): Partial<ParsedAudioMetadata> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 36) return {};

  const header = String.fromCharCode(...bytes.subarray(0, 4));
  const format = String.fromCharCode(...bytes.subarray(8, 12));
  if (header !== 'RIFF' || format !== 'WAVE') {
    return {};
  }

  const result: Partial<ParsedAudioMetadata> = {};
  let offset = 12;

  while (offset + 8 < bytes.length) {
    const chunkId = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const chunkSize =
      bytes[offset + 4] |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      (bytes[offset + 7] << 24);

    if (chunkSize <= 0 || offset + 8 + chunkSize > bytes.length) {
      break;
    }

    if (chunkId === 'LIST') {
      const listType = String.fromCharCode(...bytes.subarray(offset + 8, offset + 12));
      if (listType === 'INFO') {
        let subOffset = offset + 12;
        const listEnd = offset + 8 + chunkSize;

        while (subOffset + 8 < listEnd) {
          const subId = String.fromCharCode(...bytes.subarray(subOffset, subOffset + 4));
          const subSize =
            bytes[subOffset + 4] |
            (bytes[subOffset + 5] << 8) |
            (bytes[subOffset + 6] << 16) |
            (bytes[subOffset + 7] << 24);

          if (subSize <= 0 || subOffset + 8 + subSize > listEnd) break;

          const textBytes = bytes.subarray(subOffset + 8, subOffset + 8 + subSize);
          const val = new TextDecoder('utf-8').decode(textBytes).replace(/\0+$/, '').trim();

          if (subId === 'INAM') result.title = val;
          else if (subId === 'IART') result.artist = val;
          else if (subId === 'IPRD') result.album = val;
          else if (subId === 'IGNR') result.genre = val;
          else if (subId === 'ICRD') {
            const y = parseInt(val, 10);
            if (!isNaN(y)) result.year = y;
          }

          // Chunks are padded to 2-byte boundary
          subOffset += 8 + subSize + (subSize % 2);
        }
      }
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return result;
}

// Accurately extract duration of an audio File via HTML5 Audio element
export async function getAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const url = URL.createObjectURL(file);
      audio.src = url;

      const cleanUp = () => {
        URL.revokeObjectURL(url);
        audio.remove();
      };

      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        cleanUp();
        if (isNaN(dur) || dur <= 0) {
          resolve(180); // default fallback
        } else {
          resolve(Math.round(dur));
        }
      };

      audio.onerror = () => {
        cleanUp();
        resolve(180);
      };

      // Safety timeout after 2.5 seconds
      setTimeout(() => {
        cleanUp();
        resolve(180);
      }, 2500);
    } catch {
      resolve(180);
    }
  });
}

// Convert Blob to Base64 / Data URL
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Main high-level parser for imported audio file
export async function extractAudioFileMetadata(file: File): Promise<ParsedAudioMetadata> {
  const parsedFilename = parseFilenameMetadata(file.name);

  let meta: Partial<ParsedAudioMetadata> = {};

  try {
    // Read the first 256KB for header/ID3 tags (much faster than reading 40MB file)
    const headerSlice = file.slice(0, Math.min(file.size, 262144));
    const buffer = await headerSlice.arrayBuffer();

    if (file.name.toLowerCase().endsWith('.wav')) {
      meta = parseWAVInfo(buffer);
    } else {
      meta = parseID3v2(buffer);
    }
  } catch (err) {
    console.warn('Metadata parsing warning for', file.name, err);
  }

  // Get duration
  const duration = await getAudioFileDuration(file);

  let artworkDataUrl: string | undefined = undefined;
  if (meta.artworkBlob) {
    try {
      artworkDataUrl = await blobToDataURL(meta.artworkBlob);
    } catch (e) {
      console.warn('Artwork data URL conversion error:', e);
    }
  }

  return {
    title: meta.title && meta.title.trim() ? meta.title.trim() : parsedFilename.title,
    artist: meta.artist && meta.artist.trim() ? meta.artist.trim() : parsedFilename.artist,
    album: meta.album && meta.album.trim() ? meta.album.trim() : 'Local Audio Import',
    genre: meta.genre && meta.genre.trim() ? meta.genre.trim() : 'Local Import',
    year: meta.year || new Date().getFullYear(),
    duration: duration > 0 ? duration : 180,
    artworkDataUrl,
    artworkBlob: meta.artworkBlob,
  };
}
