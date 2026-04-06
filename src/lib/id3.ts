/**
 * MP3 ID3v2 태그에서 제목(TIT2)을 추출
 * 첫 4KB만 읽어서 파싱 (전체 다운로드 불필요)
 */
export function parseId3Title(buffer: Buffer): string | null {
  // ID3v2 헤더 확인
  if (buffer.length < 10) return null;
  const header = buffer.subarray(0, 3).toString('ascii');
  if (header !== 'ID3') return null;

  const majorVersion = buffer[3];
  // ID3v2 사이즈 (synchsafe integer)
  const tagSize =
    ((buffer[6] & 0x7f) << 21) |
    ((buffer[7] & 0x7f) << 14) |
    ((buffer[8] & 0x7f) << 7) |
    (buffer[9] & 0x7f);

  const headerSize = 10;
  const limit = Math.min(headerSize + tagSize, buffer.length);
  let pos = headerSize;

  // ID3v2.3/2.4 프레임 파싱
  while (pos + 10 < limit) {
    const frameId = buffer.subarray(pos, pos + 4).toString('ascii');
    const frameSize = majorVersion === 4
      ? ((buffer[pos + 4] & 0x7f) << 21) | ((buffer[pos + 5] & 0x7f) << 14) | ((buffer[pos + 6] & 0x7f) << 7) | (buffer[pos + 7] & 0x7f)
      : buffer.readUInt32BE(pos + 4);

    if (frameSize === 0 || frameSize > limit) break;

    if (frameId === 'TIT2') {
      // TIT2 = Title
      const encoding = buffer[pos + 10];
      const textData = buffer.subarray(pos + 11, pos + 10 + frameSize);

      if (encoding === 0) {
        // ISO-8859-1
        return textData.toString('latin1').replace(/\0/g, '').trim();
      } else if (encoding === 1) {
        // UTF-16 with BOM
        return decodeUtf16(textData);
      } else if (encoding === 2) {
        // UTF-16BE
        return textData.toString('utf16le').replace(/\0/g, '').trim();
      } else if (encoding === 3) {
        // UTF-8
        return textData.toString('utf-8').replace(/\0/g, '').trim();
      }
    }

    pos += 10 + frameSize;
  }

  return null;
}

function decodeUtf16(data: Buffer): string {
  if (data.length < 2) return '';
  // BOM 확인
  const bom = (data[0] << 8) | data[1];
  const start = (bom === 0xfeff || bom === 0xfffe) ? 2 : 0;
  const isLE = bom === 0xfffe;

  let result = '';
  for (let i = start; i + 1 < data.length; i += 2) {
    const code = isLE
      ? data[i] | (data[i + 1] << 8)
      : (data[i] << 8) | data[i + 1];
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result.trim();
}
