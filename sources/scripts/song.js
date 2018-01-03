var Song = function()
{
  var self = this;
  var MAX_SONG_ROWS = 32,
      MAX_PATTERNS = 32;

  // Resources
  var mSong = {};
  var mAudio = null;
  var mAudioTimer = new CAudioTimer();
  var mPlayer = new CPlayer();
  var mJammer = new CJammer();

  this.mAudio = function(){ return mAudio; }
  this.mAudio_timer = function(){ return mAudioTimer; }

  this.mJammer = mJammer;

  var mPreload = [];

  //--------------------------------------------------------------------------
  // Song import/export functions
  //--------------------------------------------------------------------------

  this.player = function()
  {
    return mPlayer;
  }

  this.get_bpm = function()
  {
    return Math.round((60 * 44100 / 4) / mSong.rowLen);
  };

  this.update_bpm = function(bpm)
  {
    console.log("BPM: "+bpm)
    mSong.rowLen = calcSamplesPerRow(bpm);
    mJammer.updateRowLen(mSong.rowLen);
  }

  this.update_rpp = function(rpp)
  {
    setPatternLength(rpp);
    marabu.update();
  }

  this.play_note = function(note)
  {
    mJammer.addNote(note+87);
  }

  this.song = function()
  {
    return mSong;
  }

  this.to_string = function()
  {
    return JSON.stringify(this.song());
  }

  this.replace_song = function(new_song)
  {
    stopAudio();

    mSong = new_song;

    self.update_bpm(mSong.bpm ? mSong.bpm : 120);
    self.update_rpp(32);

    updateSongRanges();
  }

  this.mJammer_update = function()
  {
    return mJammer.updateInstr(this.instrument().i);
  }

  this.instrument = function(id = marabu.selection.instrument)
  {
    return self.song().songData[id];
  }

  //

  this.pattern_at = function(i,t)
  {
    return self.song().songData[i].p[t];
  }

  this.inject_pattern_at = function(i,t,v)
  {
    self.song().songData[i].p[t] = v;
    self.update_ranges();
    marabu.update();
  }

  this.note_at = function(i,t,n)
  {
    var c = self.pattern_at(i,t)-1; if(c == -1){ return; }
    return self.song().songData[i].c[c].n[n];
  }

  this.inject_note_at = function(i,t,n,v)
  {
    var c = self.pattern_at(i,t)-1; if(c == -1){ return; }
    self.song().songData[i].c[c].n[n] = (v == -87 ? 0 : clamp(v,36,107)+87);
  }

  this.effect_at = function(i,t,f)
  {
    var c = self.pattern_at(i,t)-1; if(c == -1){ return; }
    return self.song().songData[i].c[c].f[f];
  }

  this.inject_effect_at = function(i,t,f,cmd,val)
  {
    if(!cmd || val === undefined){ return; }
    var c = self.pattern_at(i,t)-1; if(c == -1){ return; }
    self.song().songData[i].c[c].f[f] = cmd;
    self.song().songData[i].c[c].f[f+32] = val;
  }

  this.erase_effect_at = function(i,t,f)
  {
    var c = self.pattern_at(i,t)-1; if(c == -1){ return; }
    self.song().songData[i].c[c].f[f] = 0;
    self.song().songData[i].c[c].f[f+32] = 0;
  }

  this.control_at = function(i,s)
  {
    return self.song().songData[i].i[s];
  }

  this.inject_control = function(i,s,v)
  {
    self.song().songData[i].i[s] = v;
    self.mJammer_update();
  }

  var setPatternLength = function (length)
  {
    if (mSong.patternLen === length)
      return;

    stopAudio();

    var i, j, k, col, notes, fx;
    for (i = 0; i < 8; i++) {
      for (j = 0; j < MAX_PATTERNS; j++) {
        col = mSong.songData[i].c[j];
        notes = [];
        fx = [];
        for (k = 0; k < 4 * length; k++)
          notes[k] = 0;
        for (k = 0; k < 2 * length; k++)
          fx[k] = 0;
        for (k = 0; k < Math.min(mSong.patternLen, length); k++) {
          notes[k] = col.n[k];
          notes[k + length] = col.n[k + mSong.patternLen];
          notes[k + 2 * length] = col.n[k + 2 * mSong.patternLen];
          notes[k + 3 * length] = col.n[k + 3 * mSong.patternLen];
          fx[k] = col.f[k];
          fx[k + length] = col.f[k + mSong.patternLen];
        }
        col.n = notes;
        col.f = fx;
      }
    }

    // Update pattern length
    mSong.patternLen = length;
  };

  this.update_ranges = function()
  {
    updateSongRanges();
  }

  var updateSongRanges = function ()
  {
    var i, j, emptyRow;

    // Determine the last song pattern
    mSong.endPattern = marabu.sequencer.length + 1;
    for (i = marabu.sequencer.length; i >= 0; --i) {
      emptyRow = true;
      for (j = 0; j < 16; ++j) {
        if (mSong.songData[j].p[i] > 0) {
          emptyRow = false;
          break;
        }
      }
      if (!emptyRow) break;
      mSong.endPattern--;
    }
  };

  this.export_wav = function()
  {
    updateSongRanges();
    
    var doneFun = function(wave)
    {
      var blob = new Blob([wave], {type: "application/octet-stream"});
      saveAs(blob, "render.wav");
    };
    generateAudio(doneFun);
  };

  this.calculate_time = function(pos = (8 * (marabu.song.length+1)))
  {
    var bpm = parseFloat(marabu.song.song().bpm);
    var beats = pos;
    var minutes = beats/bpm; 
    var seconds = minutes * 60;

    return seconds;
  }

  var generateAudio = function(doneFun, opts, override_song = null)
  {
    var display_time_el = document.getElementById("fxr30");
    var display_progress_el = document.getElementById("fxr31");

    var song = mSong;

    var render_time = marabu.song.calculate_time();
    var minutes = Math.floor(render_time/60.0);
    var seconds = Math.floor(render_time % 60);

    display_time_el.textContent = prepend_to_length(minutes,2,"0")+prepend_to_length(seconds,2,"0");

    var d1 = new Date();
    mPlayer = new CPlayer();
    mPlayer.generate(song, opts, function(progress){
      if(progress >= 1){
        var wave = mPlayer.createWave();
        var d2 = new Date();
        doneFun(wave);
        display_progress_el.className = "fl";
      }
      else{
        display_progress_el.className = "b_inv f_inv";
        display_progress_el.textContent = prepend_to_length(parseInt(progress * 100),4,"0");
      }
    });

  };

  this.prevTime = 0.0

  this.getPrevTime = function(){
    return 1.0
  }

  var stopAudio = function ()
  {
    marabu.sequencer.follower.stop();
    if(mAudio) {
      mAudio.pause();
      mAudioTimer.reset(self.getPrevTime());
    }
  };

  this.stop_song = function()
  {
    stopAudio();
    marabu.selection.row = 0;
    marabu.update();
  }

  this.start_over = function()
  {
    self.currentTime = 0; 
    self.play();
  }

  this.play_song = function(cmd)
  {
    mAudio.removeEventListener('ended', marabu.song.start_over, false);
    self.update();
    self.update_bpm(self.song().bpm);
    self.update_rpp(32);

    stopAudio();
    updateSongRanges();
    
    var options = {
      firstRow : 0,
      lastRow : mSong.endPattern - 1,
      firstCol : 0,
      lastCol : 15,
      offset : 1.0
    }

    var doneFun = function(wave)
    {
      console.log("playing..")
      marabu.sequencer.follower.start();
      mAudio.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
      mAudioTimer.reset(cmd.playFromStart?0.0:self.getPrevTime());
      mAudio.play();
    };
    generateAudio(doneFun, options);
  }

  this.play_loop = function(opts, looped_song)
  {
    //TODO: Remove this entire function in favor of loop flag in play command
    mAudio.addEventListener('ended', marabu.song.start_over, false);

    self.update_bpm(self.song().bpm);
    self.update_rpp(32);

    self.stop_song();
    updateSongRanges();

    var offset = opts.firstRow;

    var doneFun = function(wave)
    {
      console.log("playing..",offset)
      marabu.sequencer.follower.start(offset);
      mAudio.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
      mAudioTimer.reset(getPrevTime());
      mAudio.play();
    };
    generateAudio(doneFun, opts, looped_song);
  }

  this.length = 0;
  this.is_looping = false;

  this.update = function()
  {
    self.validate();
    self.update_length();
  }

  this.validate = function()
  {
    for(var i = 0; i < 16; ++i) {
      var offset = (self.length+34) - mSong.songData[i].p.length;
      if(offset < 0){ continue; }
      // Fill
      for(var fill = 0; fill < offset; ++fill){
        mSong.songData[i].p.push(0);
      }
    }
  }

  this.update_length = function()
  {
    var l = 0;
    for(var i = 0; i < 16; ++i) {
      for(var p = 0; p < mSong.songData[i].p.length; ++p){
        if(mSong.songData[i].p[p] > 0 && p > l){ l = p; }
      }
    }
    self.length = l;
  }

  //--------------------------------------------------------------------------
  // Initialization
  //--------------------------------------------------------------------------

  this.init = function ()
  {
    var i, j, o;
    // Create audio element, and always play the audio as soon as it's ready
    mAudio = new Audio();
    mAudioTimer.setAudioElement(mAudio);
    mAudio.addEventListener("canplay", function (){ 
      console.log("canplay")
      self.play(); 
    }, true);

    mSong = new Track();

    mJammer.start();
    mJammer.updateRowLen(mSong.rowLen);
  };
};

var CAudioTimer = function ()
{
  var self = this
  this.offset = 0.0

  var mAudioElement = null;
  var mStartT = 0;
  var mErrHist = [0, 0, 0, 0, 0, 0];
  var mErrHistPos = 0;

  this.setAudioElement = function (audioElement)
  {
    mAudioElement = audioElement;
  }

  this.currentTime = function ()
  {
    if (!mAudioElement)
      return 0;
    // Calculate current time according to Date()
    var t = (new Date()).getTime() * 0.001;
    var currentTime = t - mStartT;

    // Get current time according to the audio element
    var audioCurrentTime = mAudioElement.currentTime;

    // Check if we are off by too much - in which case we will use the time
    // from the audio element
    var err = audioCurrentTime - currentTime;
    if (audioCurrentTime < 0.01 || err > 0.2 || err < -0.2) {
      currentTime = audioCurrentTime;
      mStartT = t - currentTime;
      for (var i = 0; i < mErrHist.length; i++)
        mErrHist[i] = 0;
    }

    // Error compensation (this should fix the problem when we're constantly
    // slightly off)
    var comp = 0;
    for (var i = 0; i < mErrHist.length; i++)
      comp += mErrHist[i];
    comp /= mErrHist.length;
    mErrHist[mErrHistPos] = err;
    mErrHistPos = (mErrHistPos + 1) % mErrHist.length;
    
    //add playback offset 
    var t = currentTime + comp + self.offset 
    return t;
  };

  this.reset = function (offset = 0)
  {
    self.offset = offset
    mStartT = (new Date()).getTime() * 0.001;
    for (var i = 0; i < mErrHist.length; i++){
      mErrHist[i] = 0;
    }
  };
};