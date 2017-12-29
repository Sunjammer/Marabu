function Track()
{
  var MAX_SONG_ROWS = 32, MAX_PATTERNS = 32, MAX_INSTRUMENTS = 16;

  var song = {}, i, j, k, instr, col;

  // Settings  
  song.artist = "Unknown";
  song.name = "Untitled";
  song.bpm = 120;

  song.theme = new Theme().default;

  // Automated
  song.rowLen = calcSamplesPerRow(song.bpm);
  song.endPattern = 2;
  song.patternLen = 32;

  // All 8 instruments
  song.songData = [];
  for (i = 0; i < MAX_INSTRUMENTS; i++){
    instr = {};
    instr.i = [
      15,
      67,
      111,
      0,
      0,
      100,
      111,
      6,
      0,
      0,
      0,
      0,
      153,
      0,
      20,
      0,
      0,
      8,
      64,
      2,
      205,
      90,
      0,
      63,
      127,
      0,
      0,
      0,
      190,
      0,
      0,
      127 //shaper default
      ]; 

    // Sequence
    instr.p = [];
    for (j = 0; j < MAX_SONG_ROWS; j++)
      instr.p[j] = 0;

    // Patterns
    instr.c = [];
    for (j = 0; j < MAX_PATTERNS; j++)
    {
      col = {};
      col.n = [];
      for (k = 0; k < song.patternLen * 2; k++)
        col.n[k] = 0;
      col.f = [];
      for (k = 0; k < song.patternLen * 2; k++)
        col.f[k] = 0;
      instr.c[j] = col;
    }
    song.songData[i] = instr;
  }
  
  // Make a first empty pattern
  song.songData[0].p[0] = 1;

  return song;
};