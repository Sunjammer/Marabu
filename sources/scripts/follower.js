function Follower()
{
  this.timer = -1;
  this.prev = -1;
  this.offset = 0;

  this.start = function(offset = 0)
  {
    this.timer = setInterval(this.update, 16);
    this.offset = offset;
    console.log("follower","start -> "+this.offset);
  }

  this.update = function()
  {
    var t = marabu.song.mAudio_timer().currentTime();

    if (marabu.song.mAudio().ended || (marabu.song.mAudio().duration && ((marabu.song.mAudio().duration - t) < 0.1))) {
      clearInterval(this.timer);
      this.timer = -1;
      marabu.instrumentEditor.get("master.monitor").draw(-1);
      return;
    }


    marabu.instrumentEditor.get("master.monitor").draw(t);

    var n = Math.floor(t * 44100 / marabu.song.song().rowLen);
    var r = n % 32;

    if(n != this.prev){
      marabu.selection.row = r;
      marabu.selection.track = parseInt(n/32) + marabu.sequencer.follower.offset;
      marabu.update();
      this.prev = n;
    }
  }

  this.stop = function()
  {
    if(this.timer == -1){ return; }
    console.log("follower","stop");
    clearInterval(this.timer);
    this.timer = -1;
    marabu.update();
    marabu.instrumentEditor.get("master.monitor").draw(-1);
  }
}