function Control(id, control){
  this.id = id
  this.control = control
  this.control.id = id
  this.control.control = 0
  this.install = function(parent, path){
    var fc = path==""?"":path+"."+this.id
    this.control.install(parent, fc)
  }
  this.get = function(path){
    if(path.constructor===Array)
      path = path[0]
    if(path==this.id)
      return this
    return null
  }
}

function Group(id, items){
  this.id = id
  this.items = items
  this.isGroup = true
  this.install = function(parent, path){
    var thisElement = document.createElement("div");
    thisElement.className = "family";
    parent.appendChild(thisElement);
    for(var i=0; i<this.items.length; i++){
      var itm = this.items[i];
      var fc = path==""?this.id:path+"."+this.id
      itm.install(thisElement, fc);
    }
  }
  this.get = function(path){
    if(path.constructor === String){
      var delim = '.'
      path = path.split(delim)
    }
    console.log("Group try get "+path)
    if(path.length==1 && path[0] == this.id)
      return this
    for(var i=0; i<this.items.length;i++){
      if(this.items[i].id==path[0]){
        if(this.items[i].constructor === Control)
          return this.items[i]
        return this.items[i].get(path.slice(1))
      }
    }
    return null
  }

  this.flatten = function(){
    return this.items.reduce(function(prev, next){
      if(next.constructor===Group)
        prev = prev.concat(next.flatten())
      else
        prev.push(next)
      return prev
    }, [])
  }
}

function InstrumentProxy(data)
{
  this.data = data
  this.controls = new Group("controls", [
    new Group("envelope", [
      new Control("type",       new UI_Choice({name: "ENV", choices: ["NONE","WEAK","AVRG","HARD"] })),
      new Control("attack",     new UI_Slider({name: "ATK", min: 0,  max: 255 })),
      new Control("sustain",    new UI_Slider({name: "SUS", min: 0,  max: 255 })),
      new Control("release",    new UI_Slider({name: "REL", min: 0,  max: 255 })),
      new Control("curve",      new UI_Slider({name: "POW", min: 12, max: 255 }))
    ]),
    new Group("osc", [
      new Control("shape",        new UI_Choice({name: "OSC", choices: ["SIN","SINSQR","SINSAW","SINTRI","SQR","SQRSIN","SQRSAW","SQRTRI","SAW","SAWSIN","SAWSQR","SAWTRI","TRI","TRISIN","TRISQR","TRISAW","NOISE","PULSE","REVSAW"]})),
      new Control("frequency",    new UI_Slider({name: "FRQ", min: 92,  max: 164 })),
      new Control("mix",          new UI_Slider({name: "MIX", min: 0,  max: 255, center:true })),
      new Control("detune",       new UI_Slider({name: "DET", min: 0,  max: 255 }))
    ]),
    new Group("lfo", [
      new Control("shape",        new UI_Choice({name: "LFO", choices: ["SIN","SQR","SAW","TRI","NOISE","REVSAW","PULSE"] })),
      new Control("frequency",    new UI_Slider({name: "FRQ", min: 2,  max: 12 })),
      new Control("amount",       new UI_Slider({name: "AMT", min: 0,  max: 255 }))
    ]),
    new Group("effects", [
      new Group("delay", [
        new Control("rate",       new UI_Choice({name: "DLY", choices: ["OFF","1/2","1/3","1/4","1/6","1/8","1/12","1/16"] })),
        new Control("amount",     new UI_Slider({name: "AMT", min: 0,  max: 255 }))
      ]),
      new Group("filter", [
        new Control("shape",      new UI_Choice({name: "FLT", choices: ["LP","HP","LP","BP"] })),
        new Control("frequency",  new UI_Slider({name: "FRQ", min: 0,  max: 255 })),
        new Control("resonance",  new UI_Slider({name: "RES", min: 0,  max: 254 }))
      ]),
      new Control("noise",      new UI_Slider({name: "NOI", min: 0,  max: 255 })),
      new Control("bit",        new UI_Slider({name: "BIT", min: 0,  max: 255 })),
      new Control("distortion", new UI_Slider({name: "DIS", min: 0,  max: 64  })),
      new Control("pinking",    new UI_Slider({name: "PIN", min: 0,  max: 255 })),
      new Control("compressor", new UI_Slider({name: "CMP", min: 0,  max: 255 })),
      new Control("drive",      new UI_Slider({name: "DRV", min: 0,  max: 255 })),
      new Control("shape",      new UI_Slider({name: "SHP", min: 0,  max: 255, center:true }))
    ]),
    new Group("master", [
      new Control("pan", new UI_Slider({name: "PAN", min: 0,  max: 255, center:true })),
      new Control("monitor", new UI_Uv())
    ])
  ]);

  this.getAllControls = function(){
    return this.controls.flatten().map(function(c) { return c.control })
  }

  this.get_storage = function(path)
  {
    switch (path){
      case 'envelope.type'    : return 3
      case 'envelope.attack'  : return 10
      case 'envelope.sustain' : return 11
      case 'envelope.release' : return 12
      case 'envelope.curve'   : return 18
    
      case 'osc.shape'        : return 0
      case 'osc.frequency'    : return 2
      case 'osc.mix'          : return 1
      case 'osc.detune'       : return 7
    
      case 'lfo.shape'        : return 15
      case 'lfo.frequency'    : return 17
      case 'lfo.amount'       : return 16
    
      case 'effects.filter.shape'     : return 19
      case 'effects.filter.frequency' : return 20
      case 'effects.filter.resonance' : return 21
    
      case 'effects.delay.rate'       : return 27
      case 'effects.delay.amount'     : return 26
  
      case 'effects.noise'       : return 13
      case 'effects.bit'         : return 9
      case 'effects.distortion'  : return 22
      case 'effects.pinking'     : return 28
      case 'effects.compressor'  : return 14
      case 'effects.drive'       : return 23
      case 'effects.shape'       : return 31
      
      case 'master.pan'         : return 24
      case 'uv.monitor'         : return null
    }

    return -1;
  }
}
