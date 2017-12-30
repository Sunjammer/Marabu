function InstrumentUI(){
    this.currentInstrument = null
    this.el = null;


    this.start = function()
    {
        this.el = document.getElementById("instrument");
    }

    this.install = function(group, parentElement, selection_id = 0)
    {
        var thisElement = document.createElement("div");
        thisElement.className = "family";
        parentElement.appendChild(thisElement);
        
        for(var i=0;i<group.items.length;i++)
        {
            var c = group.items[i]
            if(c.isGroup){
                this.install(c, thisElement, selection_id) 
            }else{
                try{
                    c.install(thisElement);
                }catch(e){
                    console.error(e);
                }
            }
        }
        
        /*for(family_id in this.controls){
            family_el.id = family_id;
            for(control_id in this.controls[family_id]){
                var ctrl = this.controls[family_id][control_id];
                ctrl.family = family_id;
                ctrl.id = control_id;
                ctrl.control = selection_id;
                ctrl.install(family_el);
                selection_id += 1;
            }
        }*/
    }

    this.control_target = function(target_control)
    {
        for(family_id in this.controls)
        for(control_id in this.controls[family_id])
            if(this.controls[family_id][control_id].control == target_control)
            return this.controls[family_id][control_id];
    }

    this.update = function()
    {
        this.setInstrument(new Instrument())
        /*for(family_id in this.controls){
            for(control_id in this.controls[family_id]){
                var ctrl = this.controls[family_id][control_id];
                var ctrl_storage = this.get_storage(family_id+"_"+control_id);
                var value = marabu.song.control_at(marabu.selection.instrument, ctrl_storage);
                ctrl.override(value);
            }
        }*/
        marabu.song.mJammer_update();
    }

    this.setInstrument = function(instrument){
        this.currentInstrument = instrument
        this.clear()
        this.install(instrument.controls, this.el, 0)
    }

    this.clear = function(){
        while (this.el.firstChild) {
            this.el.removeChild(this.el.firstChild);
        }
    }

    this.build = function()
    {
      return "<div id='instrument'></div>";
    }
}