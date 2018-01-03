function Signal_Processor()
{
  var self = this
  this.knobs = {
    distortion:null,
    pinking:null,
    compressor:null,
    drive:null,
    bit_phaser:null,
    bit_step:null,
    pan:null,
    shape:null
  };

  this.step_last = 0;
  this.phase = 0;
  this.average = 0;

  this.operate = function(input)
  {
    var output = input;

    for(var i=0; i<self.effectChain.length;i++){
      output = self.effectChain[i](output);
    }


    self.average = ((self.average * ((self.knobs.compressor) * 1000)) + output)/(((self.knobs.compressor) * 1000)+1);

    // Pan
    var left = output * (1 - self.knobs.pan);
    var right = output * (self.knobs.pan);

    return {left:left,right:right};
  }

  this.effect_bitcrusher = function(input)
  {
    var output = input;
    
    self.phase += self.knobs.bit_phaser; // Between 0.1 and 1
    var step = Math.pow(1/2, step); // between 1 and 16

    if(self.phase >= 1.0) {
      self.phase -= 1.0;
      self.step_last = self.knobs.bit_step * Math.floor(output / step + 0.5);
    }

    output = self.knobs.bit_step < 16 ? self.step_last : output;

    return output;
  }

  var b0, b1, b2, b3, b4, b5, b6; b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

  this.effect_pinking = function(input)
  {
    var val = self.knobs.pinking;
    b0 = 0.99886 * b0 + input * 0.0555179;
    b1 = 0.99332 * b1 + input * 0.0750759;
    b2 = 0.96900 * b2 + input * 0.1538520;
    b3 = 0.86650 * b3 + input * 0.3104856;
    b4 = 0.55000 * b4 + input * 0.5329522;
    b5 = -0.7616 * b5 - input * 0.0168980;
    var output = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + input * 0.5362) * 0.1;
    b6 = input * 0.115926;

    return (output * val) + (input * (1 - val));
  }

  this.effect_compressor = function(input)
  {
    var val = self.knobs.compressor;
    var output = input;
    if(input > self.average){
      output *= 1 + val;
    }
    else if(input < self.average){
      output *= 1 - val;
    }
    return output;
  }

  this.effect_distortion = function(input)
  {
    var val = self.knobs.distortion;
    if(!val){ return input; }

    var output = input;
    output *= val;
    output = output < 1 ? output > -1 ? new Oscillator().sin(output*.25) : -1 : 1;
    output /= val;
    return output;
  }

  this.effect_shape = function(input)
  {
    var val = self.knobs.shape;
    var k = 2.0 * val / (1.0 - val);
    return (1.0 + k) * input / (1.0 + k * Math.abs(input));
  }

  this.effect_drive = function(input)
  {
    var val = self.knobs.drive;
    var output = input;
    return output * val;
  }
  
  this.defaultEffectChain = [
    self.effect_bitcrusher,
    self.effect_distortion,
    self.effect_pinking,
    self.effect_compressor,
    self.effect_drive,
    self.effect_shape
  ]

  this.effectChain = this.defaultEffectChain.concat();

  // Tools

  this.delay_conv = function(val)
  {
    return [0,32,24,16,12,8,6,4][val];
  }

  this.osc_to_waveform = function(index)
  {
    if(index == 0 ){ return [0,0]; } // SIN
    if(index == 1 ){ return [0,1]; } // SINSQR
    if(index == 2 ){ return [0,2]; } // SINSAW
    if(index == 3 ){ return [0,3]; } // SINTRI
    if(index == 4 ){ return [1,1]; } // SQR
    if(index == 5 ){ return [1,0]; } // SQRSIN
    if(index == 6 ){ return [1,2]; } // SQRSAW
    if(index == 7 ){ return [1,3]; } // SQRTRI
    if(index == 8 ){ return [2,2]; } // SAW
    if(index == 9 ){ return [2,0]; } // SAWSIN
    if(index == 10){ return [2,1]; } // SAWSQR
    if(index == 11){ return [2,3]; } // SAWTRI
    if(index == 12){ return [3,3]; } // TRI
    if(index == 13){ return [3,0]; } // TRISIN
    if(index == 14){ return [3,1]; } // TRISQR
    if(index == 15){ return [3,2]; } // TRISAW
    if(index == 16){ return [4,4]; } // NOISE
    if(index == 17){ return [6,0]; } // PULSE
    if(index == 18){ return [6,2]; } // REVSAW
  }
}