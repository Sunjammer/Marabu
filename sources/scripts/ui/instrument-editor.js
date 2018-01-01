function InstrumentEditor(){
    this.currentInstrument = null
    this.el = null;

    this.start = function()
    {
        console.log("Started InstrumentEditor");
        this.el = document.getElementById("instrument");
    }

    this.install = function(group, parentElement)
    {
        var rootElement = document.createElement("div");
        rootElement.className = "family";
        parentElement.appendChild(rootElement);
        
        for(var i=0;i<group.items.length;i++)
        {
            var c = group.items[i]
            try{
                c.install(rootElement, "")
            }catch(e){
                console.error(e);
            }
        }
    }

    this.control_target = function(target_control)
    {
        var ctrls = this.currentInstrument.getAllControls();
        return ctrls[target_control]
    }

    this.update = function()
    {
        var instr = this.currentInstrument
        var ctrls = instr.getAllControls();
        var idx = 0
        ctrls.forEach(function(ctrl){
            var ctrl_storage = instr.get_storage(ctrl.path)
            var value = marabu.song.control_at(marabu.selection.instrument, ctrl_storage);
            ctrl.override(value);
            ctrl.setSelected(marabu.selection.control==idx++);
        })
        marabu.song.mJammer_update();
    }

    this.get = function(path){
        if(this.currentInstrument!=null)
            return this.currentInstrument.get(path)
    }

    this.setInstrument = function(instrument){
        this.clear();
        this.currentInstrument = new InstrumentProxy(instrument)
        this.install(this.currentInstrument.controls, this.el, "");
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