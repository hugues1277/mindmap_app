//**********************************************************************************************************************************

var jsonMap, rightMenuId=0

var MindMapAdmin = {

  jsonMapIni:  {"setting":{"bubbleColor":"0069B5","lineColor":"000000"},"bubble":[{"id":"1","x":4000,"y":4000,"title":"hello","text":"","url":"","color":"009688"}],"link":[]},
  mapName:'My mindMap',
  file: {
     edited: !1,
     mtime: null,
     dir: null,
     name: null,
     content: null,
     writeable: null,
     mime: null,
     size: null
  },
  init: function() {
    
    var self=this
    $('#saveMindMap').click(function(){ self.saveMindMap() });
    $('#exportMap').click(function(){ self.exportMap() });
    $('#close-button').click(function(){ window.parent.OCA.MindMap_App.closeEditor() });
    this.loadData()
  },
  loadData: function() {

    var self = this;
    window.parent.OCA.MindMap_App.load(function(data){
      if(data){
        try {
          self.file = data;
          jsonMap=(data.content.length>30?(self.jsonMapValidator(JSON.parse(data.content))||self.jsonMapIni):self.jsonMapIni)
          self.mapName=(self.file.name?self.file.name.split('.').slice(0, -1).join('.'):'MindMap')
          $('#corner').html(self.mapName)
          if(self.file.writeable){
            Corner.init()
            EditorSetting.setEditMode()
          }else{
            $('#corner').attr('title',t("mindmap_app", "Export")).click(function(){ self.exportMap() });
          }
        } catch (e){
          console.log(e)
          self.displayMessage(t("mindmap_app", "This file is not a valid mind map file."))
          jsonMap=self.jsonMapIni
        }
        MapCreator.displayAllBubbles()
        MindMapEditor.getDetails(jsonMap["bubble"][0]["id"])
        setTimeout(function(){ EditorSetting.setEditorSize() },100)
        EditorSetting.setInitialPosition()
        EditorSetting.unload()
      }
    });
  },
  saveMindMap: function() {
    EditorSetting.load()
    var self = this;
    this.displayMessage(t("mindmap_app", 'Saving...'));
    var data = JSON.stringify(self.jsonMapValidator(jsonMap)).replace(/,null||null,/gi, "");
    window.parent.OCA.MindMap_App.save(data, function(msg){
      self.displayMessage(msg);
      EditorSetting.unload()
    }, function(msg){
      self.displayMessage(msg);
      EditorSetting.unload()
    });
  },
  exportMap: function() {
    
    var self=this
    EditorSetting.openQuitMenu()
    EditorSetting.load()
    MouseWheel.setZoom(1) // reset scale
    
    var minX=8000,maxX=0,minY=8000,maxY=0
    for(k in jsonMap["bubble"]){

      if(jsonMap["bubble"][k]['x']<minX)
        minX=parseInt(jsonMap["bubble"][k]['x'])
      if(jsonMap["bubble"][k]['x']>maxX)
        maxX=jsonMap["bubble"][k]['x']
      if(jsonMap["bubble"][k]['y']<minY)
        minY=jsonMap["bubble"][k]['y']
      if(jsonMap["bubble"][k]['y']>maxY)
        maxY=jsonMap["bubble"][k]['y']
    }
    var imgWidth=maxX-minX+200
    var imgHeight=maxY-minY+200
    minX-=100
    minY-=100
    
    $('#mapBox').css({'position':'fixed','border-width':'0'})
    html2canvas(document.querySelector("#mapBox")).then(canvas => {
       
      var extra_canvas = document.createElement("canvas");
      extra_canvas.setAttribute('width',imgWidth);
      extra_canvas.setAttribute('height',imgHeight);
      var ctx = extra_canvas.getContext('2d');
      ctx.drawImage(canvas,minX,minY,imgWidth, imgHeight,0,0,imgWidth,imgHeight);
      var dataURL = extra_canvas.toDataURL();
      $('#imagePreview img').attr('src',dataURL)
      $("#imagePreview").fadeIn(200);
      
      $('#exportPng').unbind( "click" ).click(function(){ self.download(self.mapName+'.jpg',dataURL.replace("image/jpeg", "image/octet-stream")) });
      $('#exportHtml').unbind( "click" ).click(function(){ self.exportHtml(minX,minY,imgWidth,imgHeight) });

      $('#mapBox').css('position','absolute','border-width','5px')
      EditorSetting.setInitialPosition()
      EditorSetting.unload()
    });
  },
  download: function(name, data) {
    
    let a = document.createElement('a');
    a.href = data;
    a.download = name;
    a.click();
    delete a;
  },
  exportHtml: function(minX,minY,imgWidth,imgHeight) {

    var self=this
    EditorSetting.load()
    
    $.get($("link[href*='mindmap.css']").attr('href'))
      .done(function(css) {
        var tmpMap=JSON.stringify(jsonMap["bubble"])
        var map=[]
        for(k in jsonMap["bubble"]){
          jsonMap["bubble"][k]['x']=jsonMap["bubble"][k]['x']-minX      
          jsonMap["bubble"][k]['y']=jsonMap["bubble"][k]['y']-minY
          
          map[jsonMap["bubble"][k]['id']]={ title:jsonMap["bubble"][k]['title'],text:jsonMap["bubble"][k]['text'],url:jsonMap["bubble"][k]['url'] }
        }
        MapCreator.displayAllBubbles()
      
        $( "#mapBox .draggable" ).each(function() {
          $( this ).attr("onclick",
                         `document.getElementById("map-editor-title").value=decodeURIComponent(\"`+map[this.id]['title']+`\");
                          document.getElementById("map-editor-text").innerHTML=decodeURIComponent(\"`+map[this.id]['text']+`\");
                          document.getElementById("map-editor-url").value=decodeURIComponent(\"`+map[this.id]['url']+`\");`);
        });
      
        css+=`
          html{
            font-family: Arial, Helvetica, sans-serif;
            color: var(--color-main-text);
            overflow:scroll;
          }
          #mapBox{
            margin-left: 250px;  
            height:`+imgHeight+`px;
            width:`+imgWidth+`px;
            border:0;
          }
          #map-editor{
            width:250px;
          }
          #iframePage{
            width:calc(100% - 250px);
          }
          #map-editor-loadUrl{
            background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiB2ZXJzaW9uPSIxLjEiIGhlaWdodD0iMTYiPjxwYXRoIGQ9Im04LjUgMC41Yy0wLjg5NzQgMC0xLjM0MDQgMS4wOTA5LTAuNjk3MyAxLjcxNjhsNC43ODM3IDQuNzgzMmgtMTEuNTczYy0xLjM1MjMtMC4wMTkxMjUtMS4zNTIzIDIuMDE5MSAwIDJoMTEuNTcybC00Ljc4MzIgNC43ODMyYy0wLjk4MTYzIDAuOTQyNTEgMC40NzE1NSAyLjM5NTcgMS40MTQxIDEuNDE0MWw2LjQ5MTEtNi40OWMwLjM4Ny0wLjM4NzggMC4zOTEtMS4wMjI4IDAtMS40MTRsLTYuNDkwNi02LjQ5MDNjLTAuMTg4My0wLjE5MzUtMC40NDY4LTAuMzAyNjgtMC43MTY4LTAuMzAyN3oiIGZpbGw9IiMwMDAiLz48L3N2Zz4K);
          }
          #map-editor-quitUrl{
            background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTYiIHdpZHRoPSIxNiIgdmVyc2lvbj0iMS4xIiB2aWV3Ym94PSIwIDAgMTYgMTYiPjxwYXRoIGQ9Im0xNCAxMi4zLTEuNyAxLjctNC4zLTQuMy00LjMgNC4zLTEuNy0xLjcgNC4zLTQuMy00LjMtNC4zIDEuNy0xLjcgNC4zIDQuMyA0LjMtNC4zIDEuNyAxLjctNC4zIDQuM3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4K);
          }
        `
      
        var html=`
              <iframe  id="iframePage" src=""></iframe> <!-- iframe to display another web site -->
              <div id="map-editor-quitUrl" class="icon"  onclick="
                    document.getElementById('iframePage').src='';
                    document.getElementById('iframePage').style.display='none';
                    document.getElementById('map-editor-quitUrl').style.display='none';"></div>
              <div id="map-editor" align="center">
                <input type="text" id="map-editor-title" readonly>    
                <div id="map-editor-text"></div>
                <div id="map-edito-url-box">
                  <input type="text" id="map-editor-url" placeholder="Web site" readonly>
                  <div id="map-editor-loadUrl" class="icon" 
                    onclick="
                      document.getElementById('iframePage').src=document.getElementById('map-editor-url').value;
                      document.getElementById('iframePage').style.display='block';
                      document.getElementById('map-editor-quitUrl').style.display='block';
                      document.getElementById('map-editor').style.width='250px';"
                    ondblclick="
                      document.getElementById('map-editor-link').href=document.getElementById('map-editor-url').value;
                      document.getElementById('map-editor-link').click();
                      document.getElementById('iframePage').style.display='none';
                      document.getElementById('map-editor-quitUrl').style.display='none';"></div>
                  <a id="map-editor-link" href="" target="blank" hidden></a>
                </div>    
              </div>
              `+document.getElementById("mapBox").outerHTML
        
        var js=`
              var MouseMoveMap = { handTool:true, init: function() { var self=this; document.getElementById("mapBox").addEventListener('mousedown', function(e){ self.initMove(e,1) }, false); /* computer */ document.body.addEventListener('touchstart', function(e){ self.initMove(e,0) }, false); /* toutch screen */ }, addEvent: function(b,c) { (document.addEventListener)?document.addEventListener(b,c,false):document.attachEvent("on"+b,c); }, removeEvent: function(b,c) { (document.removeEventListener)?document.removeEventListener(b,c,false):document.detachEvent("on"+b, c); }, initMove: function(e,n) { if (!this.handTool) return; initialScrollX = window.pageXOffset || document.documentElement.scrollLeft; initialScrollY = window.pageYOffset || document.documentElement.scrollTop; mouse=n; if(mouse){ initialClickX = e.clientX; initialClickY = e.clientY; this.addEvent( "mousemove", this.doMove); this.addEvent( "mouseup", this.endMove); }else{ initialClickX = e.changedTouches[0].pageX; initialClickY = e.changedTouches[0].pageY; this.addEvent( "touchmove", this.doMove); this.addEvent( "touchend", this.endMove); } }, doMove: function(e) { window.scrollTo(initialScrollX + initialClickX - (mouse?e.clientX:e.changedTouches[0].pageX), initialScrollY + initialClickY - (mouse?e.clientY:e.changedTouches[0].pageY)); }, endMove: function() { MouseMoveMap.removeEvent( "mousemove", MouseMoveMap.doMove); MouseMoveMap.removeEvent( "mouseup", MouseMoveMap.endMove); MouseMoveMap.removeEvent( "touchmove", MouseMoveMap.doMove); MouseMoveMap.removeEvent( "touchend", MouseMoveMap.endMove); }, }
              window.addEventListener('load', function () {
                MouseMoveMap.init(); 
                if(document.getElementById('`+jsonMap["bubble"][0]['id']+`')){
                  document.getElementById('`+jsonMap["bubble"][0]['id']+`').click();
                }
              }, false);`
             
        var htmlContent=`<html><head><title>`+self.mapName+`</title><style>`+css+`</style><script>`+js+`</script></head><body>`+html+`</body></html>`
    
        data='data:text/plain;charset=utf-8,' + encodeURIComponent(htmlContent)
        self.download(self.mapName+'.html',data)
      
        jsonMap["bubble"]=JSON.parse(tmpMap)
        MapCreator.displayAllBubbles()
        EditorSetting.unload()
        EditorSetting.closeQuitMenu()
       }).fail(function(e) {
          self.displayMessage(t("mindmap_app", "An error occurred during the export."))
       })
    
  },
  jsonMapValidator: function(map) {
    
    var self=this
    if(!map["setting"] && !map["bubble"] && !map["link"]){ // good form
      return this.jsonMapIni;
    }
    var i,k,e,f
    for (k in map["bubble"]){
      if(map["bubble"][k]){ // valid position
        if(map["bubble"][k]['x']<0 || map["bubble"][k]['y']<0){
          delete map["bubble"][k]
        }
        i=0
        for (e in map["bubble"]){ // remove duplicates
          if(map["bubble"][e] && map["bubble"][k]){
            if(map["bubble"][e]['id']==map["bubble"][k]['id']){
              i+=1;
              if(i>1){ delete map["bubble"][e] }
            }
          }
        }
      }
    }
    for (k in map["link"]){ // link inspect
      if(map["link"][k]){
        if(map["link"][k]['end']==map["link"][k]['begin']){ //same begin, end
          delete map["link"][k]
        }else{
          i=0
          for (e in map["bubble"]){ // begin and end connected
            if(map["bubble"][e]){
              if(map["link"][k]['begin']==map["bubble"][e]['id']){
                for (f in map["bubble"]){
                  if(map["bubble"][f] && map["link"][k]['end']==map["bubble"][f]['id']){
                    i=1;
                    break
                  }
                }
              }else if(map["link"][k]['end']==map["bubble"][e]['id']){
                for (f in map["bubble"]){
                  if(map["bubble"][f] && map["link"][k]['begin']==map["bubble"][f]['id']){
                    i=1;
                    break
                  }
                }
              }
            }
          }
          if(!i){ 
            delete map["link"][k] 
          }else{
            i=0
            for (e in map["link"]){ // remove duplicates
              if(map["link"][e]){
                if(map["link"][k]['begin']==map["link"][e]['begin'] && map["link"][k]['end']==map["link"][e]['end'] || map["link"][k]['begin']==map["link"][e]['end'] && map["link"][k]['end']==map["link"][e]['begin']){
                  i+=1;
                }
              }
            }
            if(i>1){ delete map["link"][k] }
          }
        }
      }
    }
    if(map["bubble"].length>0){
      return map
    }else{
      self.displayMessage(t("mindmap_app", "The file format is invalid."))
      return ''
    }
  },
  timeout1:null, 
  timeout2:null,
  displayMessage: function(message) {
    if(message){
      $('.message').clearQueue().finish();
      clearTimeout(this.timeout1);
      clearTimeout(this.timeout2);
      $('.message p').text(message);
      $(".message").animate(  {'top': '0px'},500);
      this.timeout1 = setTimeout("$('.message').animate(  {'top': '-200px'},400);",'2000');
      this.timeout2 = setTimeout("$('.message p').text(''); $('.message').css('top', '-100px');",'3500');
    }
  }
}

$(function() {     
  
  $('#content').attr('id',''); 
      
  MindMapEditor.init();
  SearchBox.init()
  historic.init()
  EditorSetting.init()  
  setTimeout(function(){ MindMapAdmin.init() },1000)
  
  
  funcList = ['addBubble', 'addLinkBegin', 'removeBubble', 'removeLine']
  for(var k in funcList)
    $('#'+funcList[k]).click(function(){ eval('MapCreator.'+this.id+'();'); });
  
  $('.rightMenu input').on("keyup", function() { MapCreator.editLegendLine(this.value); })
                       .on("keypress", function(event) { if(event.keyCode==13) EditorSetting.closeQuitMenu(); });
  
  $('#mapBox, #quitMenu, #corner').on("contextmenu", function(){ EditorSetting.closeQuitMenu(); return false; })
  
  $( "#map-editor" ).resizable({
    handles: 'e, w',
    maxWidth: window.innerWidth,
    minWidth: 200,
    stop: function(e) {
      EditorSetting.setEditorSize()
    }
  }) 
});

var MindMapEditor = {
  
  init: function(n) {
    var self = this;
    
    var nbColors=12
    var colors=["0069b5","2196f3","009688","55b774","42b72a","6f6f6f",
                "d696bb","f35369","b91614","f4511e","f7923b","f5c33b"]
    var editorColors=[1,1,0,0,1,1,
                      0,0,1,1,0,1]
    
    for(var k in colors){ //setting  bubble color picker
      if(k==nbColors/2)
        $('.settingBubbleColor').append('<br>')
      $('.settingBubbleColor').append('<button id="_'+colors[k]+'" style="background-color:#'+colors[k]+'" ></button>');
      $('.settingBubbleColor #_'+colors[k]).click(function(){ EditorSetting.setColor(this.id.substring(1), 'bubbleColor') });
    }
    for(var k in colors){ // setting line color picker
      if(k==nbColors/2)
        $('.settingLineColor').append('<br>')
      $('.settingLineColor').append('<button id="_'+colors[k]+'" style="background-color:#'+colors[k]+'" ></button>');
      $('.settingLineColor #_'+colors[k]).click(function(){ EditorSetting.setColor(this.id.substring(1), 'lineColor') });
    }
    $('.settingLineColor #_'+colors[k]).replaceWith('<button id="_000000" style="background-color:#000000;"></button>')
    $('.settingLineColor #_000000').click(function(){ EditorSetting.setColor(this.id.substring(1), 'lineColor') });

    for(var k in colors){ // bubble color picker
      if(k==nbColors/2)
        $('.bpColor').append('<br>')
      $('.bpColor').append('<button id="_'+colors[k]+'" style="background-color:#'+colors[k]+'" ></button>');
      $('.bpColor #_'+colors[k]).click(function(){ MapCreator.setBubbleColor(this.id.substring(1)) });
    }
    for(var k in colors){ // line color picker
      if(k==nbColors/2)
        $('.bpColorMini').append('<br>')
      $('.bpColorMini').append('<button id="_'+colors[k]+'" style="background-color:#'+colors[k]+'" ></button>');
      $('.bpColorMini #_'+colors[k]).click(function(){ MapCreator.setLineColor(this.id.substring(1)) });
    }
    $('.bpColorMini #_'+colors[k]).replaceWith('<button id="_000000" style="background-color:#000000;"></button>')
    $('.bpColorMini #_000000').click(function(){ MapCreator.setLineColor(this.id.substring(1)) });
    
    for(var k in colors){ // editor color picker
      if(editorColors[k]){
        $('#map-editor-color').append('<button id="_'+colors[k]+'" style="background-color:#'+colors[k]+'" ></button>');
        $('#map-editor-color #_'+colors[k]).click(function(){ self.commande('foreColor', '#'+this.id.substring(1)); });
      }
    }
    $('#map-editor-color').append('<button id="_000000" style="background-color:#000000;"></button>')
    $('#map-editor-color #_000000').click(function(){ self.commande('foreColor', '#'+this.id.substring(1)); });
    
    var tab=['justifyLeft','justifyCenter','justifyRight','insertUnorderedList','bold','italic','underline']
    for (k in tab){
      $('#map-editor-commands').append(`<button class="icon" id="`+tab[k]+`"></button>`)
      $('#map-editor-commands #'+tab[k]).click(function(){ self.commande(this.id) });
    }

    $('#map-editor-title').on("input", function() { self.editBubbleTitle(this.value); })
                          .on("keypress", function(event) { if(event.keyCode==13) document.getElementById('map-editor-text').focus(); })
    
    $('#map-editor-text').on("keypress", function() { self.editBubbleText(this.innerHTML); })
                         .on("input", function() { self.editBubbleText(this.innerHTML); })
                         .on("blur", function() { historic.saveAction(jsonMap["bubble"][rightMenuId]['id']); })

    $('#map-editor-url').on("input", function() { self.editBubbleUrl(this.value); })
                        .on("keypress", function(event) { if(event.keyCode==13) self.showWebPage(); })
                        .on("blur", function() { historic.saveAction(jsonMap["bubble"][rightMenuId]['id']); })
       
    $('#map-editor-loadUrl').on("click", function() { self.showWebPage(); })
                            .on("dblclick", function() { self.showWebPage(1); })
    
    $('#map-editor-quitUrl').on("click", function() { self.showWebPage(); })
    
    $('#map-editor-hide').on("click", function() { self.openDetails(); })
    
	},
  commande: function(nom, argument) {
		if (typeof argument === 'undefined') {
      argument = '';
    }
    switch (nom) {
      case "createLink":
        argument = prompt("your link ?");
        break;
      case "insertImage":
        argument = prompt("your image ?");
        break;
    }
    document.execCommand(nom, false, argument);
	},
  editBubbleTitle: function(text) {
    $('#Map-bubble-title'+jsonMap["bubble"][rightMenuId]['id']).text(text)
		jsonMap["bubble"][rightMenuId]['title']=encodeURIComponent(text)
    MapCreator.displayBubbleLine(jsonMap["bubble"][rightMenuId]['id'])
	},
  editBubbleText: function(text) {
    jsonMap["bubble"][rightMenuId]['text']=encodeURIComponent(text)
	},
  editBubbleUrl: function(text) {
		$('#map-editor-link').attr("href",text)
    if(text!=''){
      $('#map-editor-loadUrl').css('display','inline-block')
    }else{
      $('#loadUrl').css('display','none')
    }
    jsonMap["bubble"][rightMenuId]['url']=encodeURIComponent(text)
	}, 
  showWebPage: function(n) {

    if(n){
      $('#map-editor-link')[0].click()      
    }else if($('#iframePage').css("display")!="none"){
      $('#iframePage, #map-editor-quitUrl').fadeOut(200)
      $('#iframePage').attr("src","")    
    }else if(jsonMap["bubble"][rightMenuId]['url'] !=""){
      $('#iframePage, #map-editor-quitUrl').fadeIn(200)
      $('#iframePage').attr("src","?url="+jsonMap["bubble"][rightMenuId]['url'])  
      $('#map-editor').animate({'width':'30%'},300)
      EditorSetting.setEditorSize()
    }
	},
  getDetails: function(id){

    for (var k in jsonMap["bubble"]){
      if(jsonMap["bubble"][k] && jsonMap["bubble"][k]["id"]==id){
        rightMenuId=k
        break
      }
    }
    $('#map-editor-title').val(decodeURIComponent(jsonMap["bubble"][k]["title"]||''))
    $('#map-editor-text').html(decodeURIComponent(jsonMap["bubble"][k]["text"]||''))
    $('#map-editor-url').val(decodeURIComponent(jsonMap["bubble"][k]["url"]||''))
    if(!EditorSetting.editMode && !jsonMap["bubble"][k]["url"]){
      $('#map-editor-url').hide()
    }else{
      $('#map-editor-url').show()
    }
    if(decodeURIComponent(jsonMap["bubble"][k]["url"])!=''){
      $('#map-editor-link').attr("href",decodeURIComponent(jsonMap["bubble"][k]["url"]))
      $('#map-editor-loadUrl').css('display','inline-block')
    }else{
      $('#map-editor-loadUrl').css('display','none')
    }

    if(EditorSetting.editMode){
      if($('#map-editor-title').val()=="Bubble")
        $('#map-editor-title').select();
      else
        $('#map-editor-title').focus().val("").val(decodeURIComponent(jsonMap["bubble"][k]["title"]));
    }
    this.openDetails(1)
  },
  open:false,
  openDetails: function(n){  // open details in left
    if(n && !this.open){
      $('#map-editor').animate({ 'width':'30%', 'left':'0px' },'200');
      this.open=true

    }else if(!n && this.open){
      $('#map-editor').animate({ 'width':'300px', 'left':'-320px' },'fast');
      this.open=false
    }
  },  
}

//********************************************************************************************************************************** menu
  
var EditorSetting = {
  
  init: function(){
    var self=this
    $('#quitMenu, #codePreviewArea, #imagePreview').click(function(){ self.closeQuitMenu(); });
    $('#nav-bar button').click(function(){ self.setInitialPosition(); });
    $('#openColorMenu').click(function(){ self.openColorMenu(); });
    $('#openCodePreview').click(function(){ self.openCodePreview(); });
  },  
  editMode:false,
  setEditorSize: function(){
    var h = (this.editMode? window.innerHeight - parseInt($("#map-editor-color").height()) - parseInt($("#map-editor-commands").height()) - 150 : window.innerHeight - 150)    
    $('#map-editor #map-editor-text').animate({'height':h+'px'},'slow')
  },
  setEditMode: function() {
    
    if(this.editMode){  
      $("#map-editor-commands, #map-editor-color").fadeOut(1000);
      $('#map-editor #map-editor-text').attr("contentEditable","false")
      $('#map-editor #map-editor-title').attr("readonly","true")
      $('#map-editor #map-editor-url').attr("readonly","true")
      Corner.closeCorner()
    }else{ 
      $("#map-editor-commands, #map-editor-color").fadeIn(1000);
      $('#map-editor #map-editor-text').attr("contentEditable","true")
      $('#map-editor #map-editor-title').removeAttr("readonly")
      $('#map-editor #map-editor-url').removeAttr("readonly")
      Corner.openCorner()
    }
    this.editMode=!this.editMode;
    this.setEditorSize()
    MapCreator.displayAllBubbles()
    MindMapEditor.getDetails(jsonMap["bubble"][0]["id"])
	},
  openColorMenu: function() {
    $('.colorMenu').fadeIn(200)
    $('.colorMenu .Map-bubble').css('background-color','#'+jsonMap["setting"]["bubbleColor"])
    $('.colorMenu .formLine').css('background-color','#'+jsonMap["setting"]["lineColor"])
    $("#quitMenu").show();
	},
  setColor: function(color, type) {
    jsonMap["setting"][type]=color
    $('.colorMenu '+ (type=='bubbleColor'?'.Map-bubble':'.formLine')).css('background-color','#'+color)
	},
  closeColorMenu: function() {
    $('.colorMenu').fadeOut(200)
	},
  openCodePreview: function() {

    this.closeColorMenu()
    $('#codePreviewArea').fadeIn(200)
    $('#codePreviewArea textarea').val(JSON.stringify(jsonMap, null, 4)).focus()
    
    $('#quittCodePreview').click(function(){ $('#codePreviewArea').fadeOut(200); });
    $('#saveCodePreview').click(function(){ 
      try{
        tmp=MindMapAdmin.jsonMapValidator(JSON.parse($('#codePreviewArea textarea').val()))
        if(!tmp)
          throw "bad json"
        jsonMap=tmp
        MapCreator.displayAllBubbles()
        $('#codePreviewArea').fadeOut(200)
      }catch(e){
        console.log(e)
        MindMapAdmin.displayMessage(t("mindmap_app", "The file format is invalid."))
      }
    });
	},  
  closeCodePreview: function() {
    $('#codePreviewArea').fadeOut(200)
	},
  openQuitMenu: function() {
    $("#quitMenu").fadeIn(200)
	},  
  closeQuitMenu: function(n) {
    $("#quitMenu, .rightMenu, #codePreviewArea, #imagePreview").fadeOut(200);
    this.closeColorMenu()
    this.closeCodePreview()
    this.unload()
	},
  loadTimeout:null,
  load: function() {
    $("#loading").show()
	},  
  unload: function(n) {
    $("#loading").fadeOut(200)
	},
  setInitialPosition: function() {
    for (var k in jsonMap["bubble"]){
      if(jsonMap["bubble"][k]){
        MindMapEditor.getDetails(jsonMap["bubble"][k]['id'])
        offset=($('#map-editor').css('left')=='0px'?parseFloat($('#map-editor').width()):0)
        window.scrollTo(jsonMap["bubble"][k]['x']-offset-((screen.width-offset)/3), 
                        jsonMap["bubble"][k]['y']-(screen.height/2)+100);
        break
      }
    }
	},
}

// ******************************************************************************************************** previous next function

var historic = {
  
  jsonPrevActions:[],
  jsonNextActions:[],
  jsonNextId:0,
  init: function() {
    
    var self=this
    $('#prevAction').click(function(){ self.prevAction(); });
    $('#nextAction').click(function(){ self.nextAction(); });
	},
  saveAction: function(id,n) {
    
    if(n){
      for(i=1;i<this.jsonPrevActions.length+1;i++){
        if(this.jsonPrevActions['id'] && this.jsonPrevActions['id']==id){
          return
        }
      }
    }
    this.jsonNextActions=[]
    k=MapCreator.getBubbleId(id)
    this.jsonPrevActions.push(JSON.parse(JSON.stringify(jsonMap["bubble"][k])))
	},
  addAction: function(component) {
    if(component['action']!="editLine" || component['begin']!=this.jsonPrevActions[this.jsonPrevActions.length-1]['begin']){
      this.jsonPrevActions.push(component)
    }
	},
  prevAction: function(n) {
    
    for(i=1;i<this.jsonPrevActions.length+1;i++){
      el=this.jsonPrevActions[this.jsonPrevActions.length-i]
      if(el){

        if(el['action']){
          if(el['action']=="createBubble"){
            rightMenuId=MapCreator.getBubbleId(el['id'])
            MapCreator.removeBubble(1)
          }else if(el['action']=="removeBubble"){
            jsonMap["bubble"].push(el['component']);
            // create links
            for(k in el['link']){
              rightMenuId=MapCreator.getBubbleId(el['id'])
              MapCreator.addLinkBegin(1)
              rightMenuId=MapCreator.getBubbleId(el['link'][k])
              MapCreator.addLinkEnd(1)
            }
          }else if(el['action']=="createLine"){
            
            rightMenuId=MapCreator.getLinkId(el["begin"], el["end"])
            if(rightMenuId!=-1)
              MapCreator.removeLine(1)
            
          }else if(el['action']=="removeLine"){
            
            rightMenuId=MapCreator.getBubbleId(el['begin'])
            MapCreator.addLinkBegin(1)
            rightMenuId=MapCreator.getBubbleId(el['end'])
            MapCreator.addLinkEnd(1)
            
          }else if(el['action']=="editLine"){
            rightMenuId = MapCreator.getLinkId(el["begin"], el["end"])
            if(rightMenuId!=-1){
              var tmp=el["legend"]
              el["legend"]=jsonMap["link"][rightMenuId]["legend"]
              jsonMap["link"][rightMenuId]["legend"]=tmp
            }
          }
        }else{
          rightMenuId=MapCreator.getBubbleId(el['id'])
          jsonMap['bubble'][rightMenuId]=el
          MindMapEditor.getDetails(jsonMap['bubble'][rightMenuId]['id'])
        }

        this.jsonNextActions.push(el)
        delete this.jsonPrevActions[this.jsonPrevActions.length-i]
        MapCreator.displayOneBubbles(el['begin']||el["id"])
        if(!n){ this.prevAction(1) } // change faster
        break
      }
    }
	},
  nextAction: function(n) {
		
    for(i=1;i<this.jsonNextActions.length+1;i++){
      el=this.jsonNextActions[this.jsonNextActions.length-i]
      if(el){
        
        if(el['action']){
          if(el['action']=="removeBubble"){
            rightMenuId=MapCreator.getBubbleId(el['id'])
            MapCreator.removeBubble(1)
          }else if(el['action']=="createBubble"){
            jsonMap["bubble"].push(el['component']);
            // create first link
            rightMenuId=MapCreator.getBubbleId(el['id'])
            MapCreator.addLinkBegin(1)
            rightMenuId=MapCreator.getBubbleId(el['link'])
            MapCreator.addLinkEnd(1)
            
          }else if(el['action']=="createLine"){
            
            rightMenuId=MapCreator.getBubbleId(el['begin'])
            MapCreator.addLinkBegin(1)
            rightMenuId=MapCreator.getBubbleId(el['end'])
            MapCreator.addLinkEnd(1)
            
          }else if(el['action']=="removeLine"){
            
            rightMenuId=MapCreator.getLinkId(el["begin"], el["end"])
            if(rightMenuId!=-1)
              MapCreator.removeLine(1)
            
          }else if(el['action']=="editLine"){
            rightMenuId = MapCreator.getLinkId(el["begin"], el["end"])
            if(rightMenuId!=-1){
              var tmp=el["legend"]
              el["legend"]=jsonMap["link"][rightMenuId]["legend"]
              jsonMap["link"][rightMenuId]["legend"]=tmp
            }
          }
        }else{
          rightMenuId=MapCreator.getBubbleId(el['id'])
          jsonMap['bubble'][rightMenuId]=el
          MindMapEditor.getDetails(jsonMap['bubble'][rightMenuId]['id'])
        }

        this.jsonPrevActions.push(el)
        delete this.jsonNextActions[this.jsonNextActions.length-i]
        MapCreator.displayOneBubbles(el['begin']||el["id"])
        if(!n){ this.nextAction(1) }
        break
      }
    }
    
	},
}
  



var MapCreator = {
  
  // ******************************************************************************************************** right menu
  
  rightClick: function(event, id){
    MapCreator.linkStep=0
    if(EditorSetting.editMode){
      for (var k in jsonMap["bubble"]){
        if(jsonMap["bubble"][k] && jsonMap["bubble"][k]["id"]==id){
          rightMenuId=k
          break
        }
      }
      $('#rightMenuBubble').css({"left":event.clientX+"px","top":event.clientY+"px"});
      $('#rightMenuBubble').fadeIn(200)
      $("#quitMenu").show();
    }else{
      MindMapAdmin.displayMessage(t("mindmap_app", "You must enable edition mode."));
    }
  },  
  rightClickLine: function(event, id, legend){
    rightMenuId=-1
    if(EditorSetting.editMode){
      for (var k in jsonMap["link"]){
        if( jsonMap["link"][k] && (jsonMap["link"][k]["begin"]+jsonMap["link"][k]["end"]==id || jsonMap["link"][k]["end"]+jsonMap["link"][k]["begin"]==id)){
          rightMenuId=k
          break
        }
      }
      if(rightMenuId!=-1){
        $('#rightMenuLine').css({"left":event.clientX+"px","top":event.clientY+"px"});
        $('#rightMenuLine').fadeIn(200)
        $('.rightMenu input').val($("#"+id).find("p").html());
        $('.rightMenu input').val(legend).select();
        $("#quitMenu").show();
      }
    }
  },

  // ******************************************************************************************************** get id

  getBubbleId: function(id){
    for (var k in jsonMap["bubble"]){
      if(jsonMap["bubble"][k] && jsonMap["bubble"][k]["id"]==id){
        return k
      }
    }
    return -1
  },
  getLinkId: function(begin, end){
    for (var k in jsonMap["link"]){
      if(jsonMap["link"][k]){
        if(jsonMap["link"][k]["begin"]==begin && jsonMap["link"][k]["end"]==end || jsonMap["link"][k]["end"]==begin && jsonMap["link"][k]["begin"]==end)
          return k
      }
    }
    return -1
  },
    
  // ******************************************************************************************************** create and display
  
  displayAllBubbles: function(){
    $('#mapBox').empty()
    for (var k in jsonMap["bubble"]){
      if(jsonMap["bubble"][k])
        this.createBubble(jsonMap["bubble"][k])
    }
    if(!EditorSetting.editMode)
      $('#mapBox .draggable').draggable('disable')
    MouseMoveMap.handTool=true;
    
    this.displayAllLine()
  },
  displayOneBubbles: function(id){
    k=this.getBubbleId(id)
    if(k!=-1){
      $('#'+jsonMap["bubble"][k]['id']).remove()
      this.createBubble(jsonMap["bubble"][k])
      MindMapEditor.getDetails(id)
    }
    this.displayBubbleLine(id)
  },
  addBubble: function(n) {
		date=new Date()
    var id = date.getUTCMilliseconds()+""+date.getSeconds()+""+date.getMinutes()+""+date.getHours();
    var p = $( "#"+jsonMap["bubble"][rightMenuId]["id"] );
    var position = p.position();
    var zoom = MouseWheel.ZoomVal;
    
    component = { "id":id, "x": position.left / zoom, "y": position.top / zoom, "title": "Bubble", "text": "", "url": "", "color":jsonMap["setting"]["bubbleColor"]}
    jsonMap["bubble"].push( component );
    jsonMap["link"].push({ "begin": id,	"end": jsonMap["bubble"][rightMenuId]["id"],	"legend": "", "color":jsonMap["setting"]["lineColor"] } );
    historic.addAction({"id":id,
                        "action":"createBubble",
                        "link":jsonMap["bubble"][rightMenuId]["id"],
                        "component":JSON.parse(JSON.stringify(component))
                       })
    this.createBubble(component)
    EditorSetting.closeQuitMenu()
    MindMapEditor.getDetails(id)
	},
  createBubble: function(component) {
    var self=this
    var id=component["id"]
    component["title"]=(component["title"]||'Bubble')
    box=`<div id="`+id+`" class="draggable Map-bubble" style="top:`+component["y"]+`px; left:`+component["x"]+`px; background-color:#`+component["color"]+`;"> 
          <p id="Map-bubble-title`+id+`" class="Map-bubble-title" `+(component["title"].length>15?`style="padding:5px;"`:``)+`>`+decodeURIComponent(component["title"])+`</p>
        </div>`
    $('#mapBox').append(box); 
    var click = {
        x: 0,
        y: 0,
        first: 0
    };
    $('.draggable#'+id).draggable({

        start: function(event) { 
          click.x = event.clientX;
          click.y = event.clientY;
          historic.saveAction(this.id,1);
        },
        drag: function(event, ui) {
          // This is the parameter for scale()
          var zoom = MouseWheel.ZoomVal;
          var original = ui.originalPosition;

          ui.position = {
              left: (event.clientX - click.x + original.left) / zoom,
              top:  (event.clientY - click.y + original.top ) / zoom
          };
          if(click.first) // bad effectfor the first line
            MapCreator.displayBubbleLine(this.id)
          else
            click.first=1;
        },
        stop: function(event,ui) {
          MouseMoveMap.handTool=true;

          var zoom = MouseWheel.ZoomVal;
          var original = ui.originalPosition;

          var position = {
              left: (event.clientX - click.x + original.left) / zoom,
              top:  (event.clientY - click.y + original.top ) / zoom
          };
          click.first=0;
          bubbleId=MapCreator.getBubbleId(this.id)
          jsonMap["bubble"][bubbleId]["x"]=position.left
          jsonMap["bubble"][bubbleId]["y"]=position.top
          MapCreator.displayBubbleLine(this.id)
          historic.saveAction(this.id); 
        }
    });
    $('#mapBox #'+id)
      .on("contextmenu", function(event) { self.rightClick(event,this.id); return false; })
      .on("mousedown", function() {
          MouseMoveMap.handTool=(!EditorSetting.editMode);                 
          MindMapEditor.getDetails(this.id); 
          self.addLinkEnd();
      }).on("mouseup", function() {
          MouseMoveMap.handTool=true;                   
      })
	},
  setBubbleColor: function(color) {
    $("#"+jsonMap["bubble"][rightMenuId]["id"]).css('background-color','#'+color);
    jsonMap["bubble"][rightMenuId]["color"]=color
    historic.saveAction(jsonMap["bubble"][rightMenuId]["id"]); 
    EditorSetting.closeQuitMenu()
	},
  removeBubble: function(n) {
		if($("#mapBox").children().length>1 && jsonMap["bubble"][rightMenuId]){ // let the last bubble
      var id = jsonMap["bubble"][rightMenuId]["id"]
      $("#"+id).remove();
      this.displayBubbleLine(id)
      var tab=[]
      for (var k in jsonMap["link"]){
        if( jsonMap["link"][k] && (jsonMap["link"][k]["begin"]==id || jsonMap["link"][k]["end"]==id) ){
          tab.push(jsonMap["link"][k]["begin"]==id?jsonMap["link"][k]["end"]:jsonMap["link"][k]["begin"])
          delete jsonMap["link"][k]; 
        }
      }
      if(!n)
        historic.addAction({"id":id,"action":"removeBubble","link":tab,"component":JSON.parse(JSON.stringify(jsonMap["bubble"][rightMenuId]))})
      delete jsonMap["bubble"][rightMenuId];
    }
    EditorSetting.closeQuitMenu()
	},
  
  displayAllLine: function(){
    $( '.line' ).remove()
    for (var k in jsonMap["link"]){
      if(jsonMap["link"][k])
        this.moveLine(jsonMap["link"][k])
    }
  },
  displayBubbleLine: function(id){
    
    for (var k in jsonMap["link"]){
      if( jsonMap["link"][k] && (jsonMap["link"][k]['begin']==id || jsonMap["link"][k]['end']==id)){
        $('#'+jsonMap["link"][k]['begin']+jsonMap["link"][k]['end']).remove()
        this.moveLine(jsonMap["link"][k])
      }
    }
  },
  moveLine: function(el){
      
    var self=this
    var p = $( "#"+el.begin );
    var p2 = $( "#"+el.end );
    if ( p.length && p2.length ) {
      var position = p.position();
      var position2 = p2.position();
      var zoom = MouseWheel.ZoomVal;
      //5 -> mapBox border or line width
      var offset=5/zoom
            
      x1= position.left / zoom + offset + p.width()/2
      y1= position.top / zoom + offset + p.height()/2
      x2= position2.left / zoom + offset + p2.width()/2
      y2= position2.top / zoom + offset + p2.height()/2

      $( '#mapBox' ).append(this.createLine(el, x1,y1,x2,y2));
      $('#mapBox #'+el.begin+el.end).on("contextmenu", function(event) { self.rightClickLine(event,this.id, decodeURIComponent(el.legend)); return false; })

    }
  },
  createLine: function(el, x1, y1, x2, y2) {
    var a = x1 - x2,
        b = y1 - y2,
        length = Math.sqrt(a * a + b * b);
    var sx = (x1 + x2) / 2,
        sy = (y1 + y2) / 2;
    var x = sx - length / 2,
        y = sy;

    var angle = Math.PI - Math.atan2(-b, a);

    var line = document.createElement("div");
    line.setAttribute("class", "line");
    line.setAttribute("id", el.begin+el.end);
    var styles = 'width: ' + length + 'px; '
               + '-moz-transform: rotate(' + angle + 'rad); '
               + '-webkit-transform: rotate(' + angle + 'rad); '
               + '-o-transform: rotate(' + angle + 'rad); '  
               + '-ms-transform: rotate(' + angle + 'rad); '  
               + 'top: ' + y + 'px; '
               + 'left: ' + x + 'px; '

    line.setAttribute('style', styles);  
    if(angle>1.559 && angle<4.7)
      line.innerHTML=`
                      <div class='formLine' style='background-color:#`+el.color+`;'></div>
                      <p class='legendLine' style='transform: rotate(180deg);'>`+decodeURIComponent(el.legend)+`</p>`
    else
      line.innerHTML=`
                      <div class='formLine' style='background-color:#`+el.color+`;'></div>
                      <p class='legendLine' style=''>`+decodeURIComponent(el.legend)+`</p>`
    return line;
  },
  editLegendLine: function(text){
    $("#"+jsonMap["link"][rightMenuId]["id"]).text(text)
    historic.addAction({
                        "begin":jsonMap["link"][rightMenuId]['begin'],
                        "end":jsonMap["link"][rightMenuId]['end'],
                        "action":"editLine",
                        "legend":jsonMap["link"][rightMenuId]["legend"]
                       })
    jsonMap["link"][rightMenuId]["legend"]=encodeURIComponent(text);
    MapCreator.displayAllLine()
  },
  setLineColor: function(color){
    $("#"+jsonMap["link"][rightMenuId]['begin']+jsonMap["link"][rightMenuId]['end']+' .formLine').css('background-color','#'+color);
    jsonMap["link"][rightMenuId]['color']=color
    EditorSetting.closeQuitMenu()
  },
  idLink:0,
  linkStep:0,
  addLinkBegin: function(n){
    if(rightMenuId!=-1 && jsonMap["bubble"][rightMenuId]){
      this.idLink=jsonMap["bubble"][rightMenuId]["id"]
      this.linkStep=1
    }
    if(!n){ EditorSetting.closeQuitMenu() }
  },
  addLinkEnd: function(n){
    if(rightMenuId!=-1 && this.linkStep==1 && jsonMap["bubble"][rightMenuId] && this.idLink!=jsonMap["bubble"][rightMenuId]["id"]){
      for (var k in jsonMap["link"]){
        if( jsonMap["link"][k] && (jsonMap["link"][k]["begin"]==this.idLink && jsonMap["link"][k]["end"]==jsonMap["bubble"][rightMenuId]["id"] || jsonMap["link"][k]["end"]==this.idLink && jsonMap["link"][k]["begin"]==jsonMap["bubble"][rightMenuId]["id"]) )
          return
      }
      jsonMap["link"].push({ "begin": this.idLink,	"end": jsonMap["bubble"][rightMenuId]["id"],	"legend": "",	"color": jsonMap["setting"]["lineColor"] } );
      this.linkStep=0
      if(!n)
        historic.addAction({
                          "begin":this.idLink,
                          "end":jsonMap["bubble"][rightMenuId]["id"],
                          "action":"createLine",
                         })
    }
    MapCreator.displayBubbleLine(this.idLink)
  },
  removeLine: function(n) {
		$("#"+jsonMap["link"][rightMenuId]["begin"]+jsonMap["link"][rightMenuId]["end"]).remove();
    if(!n)
        historic.addAction({
                          "begin":jsonMap["link"][rightMenuId]["begin"],
                          "end":jsonMap["link"][rightMenuId]["end"],
                          "action":"removeLine",
                         })
    delete jsonMap["link"][rightMenuId];
    EditorSetting.closeQuitMenu()
	},
}

// ******************************************************************************************************** mouse wheel
 
var MouseWheel = {
  
  ZoomVal:1,
  maxWheel:1.4,  
  minWheel:0.3,
  init: function() {
    var self=this
    $('#nav-bar input')
      .attr({'max':this.maxWheel, 'min':this.minWheel,'step':0.1})
      .val(this.ZoomVal)
      .on( 'change',function(e){ self.handle(0, e,$(this).val()); });
    
    var mapBox = document.getElementById("mapBox");
    if (mapBox.addEventListener)
      mapBox.addEventListener('DOMMouseScroll', this.wheel, false); //DOMMouseScroll is for mozilla. 
      mapBox.onmousewheel = this.wheel;// IE/Opera. 		
	},
  wheel: function(event) {
    EditorSetting.load()
		var delta = 0;
    if (!event) // For IE. 
      event = window.event;
    if (event.wheelDelta) { // IE/Opera. 
      delta = event.wheelDelta/120;
    } else if (event.detail) { // Mozilla case. 
      delta = -event.detail/3;
    }
    if (delta)
      MouseWheel.handle(delta, event,0);
    if (event.preventDefault)
      event.preventDefault();
    event.returnValue = false;
    EditorSetting.unload()
	},
  handle: function(delta, event, n) {
    
   
    if(!n){
      if (delta < 0 && this.ZoomVal>this.minWheel){
        this.ZoomVal-=0.05
      }else if (delta > 0 && this.ZoomVal<this.maxWheel ){
        this.ZoomVal+=0.05
      }
      $('#nav-bar input').val(this.ZoomVal)
    }else{
      this.ZoomVal=parseFloat(n)
    }    
    this.setZoom()  
	},
  setZoom: function(n){
    if(n){ this.ZoomVal=n }
    initialScrollX = window.pageXOffset || document.documentElement.scrollLeft;
    initialScrollY = window.pageYOffset || document.documentElement.scrollTop;
    var x=initialScrollX+(window.innerWidth-($('#map-editor').css('left')=='0px'?$('#map-editor').width():0))/2
    var y=initialScrollY+window.innerHeight/2

    $('#mapBox').css({ 'transform-origin':x+'px '+y+'px','transform':'scale('+this.ZoomVal+')','MozTransform':'scale('+this.ZoomVal+')' }); 
    MapCreator.displayAllBubbles()
  }
}
MouseWheel.init()


// ******************************************************************************************************** mouse move

var MouseMoveMap = {
  handTool:true,
  init: function() {
    var self=this;     
    document.getElementById("mapBox").addEventListener('mousedown', function(e){ self.initMove(e,1) }, false); /* computer */
    document.body.addEventListener('touchstart', function(e){ self.initMove(e,0) }, false); /* toutch screen */
	},
  addEvent: function(b,c) {
		(document.addEventListener)?document.addEventListener(b,c,false):document.attachEvent("on"+b,c);
	},
  removeEvent: function(b,c) {
		(document.removeEventListener)?document.removeEventListener(b,c,false):document.detachEvent("on"+b, c);
	},
  initMove: function(e,n) {
		if (!this.handTool) return;
    initialScrollX = window.pageXOffset || document.documentElement.scrollLeft;
    initialScrollY = window.pageYOffset || document.documentElement.scrollTop;
    mouse=n;
    if(mouse){
      initialClickX = e.clientX;
      initialClickY = e.clientY;
      this.addEvent( "mousemove", this.doMove);
      this.addEvent( "mouseup", this.endMove);
    }else{
      initialClickX = e.changedTouches[0].pageX;
      initialClickY = e.changedTouches[0].pageY;
      this.addEvent( "touchmove", this.doMove);
      this.addEvent( "touchend", this.endMove);
    }
	},
  doMove: function(e) {
	  window.scrollTo(initialScrollX + initialClickX - (mouse?e.clientX:e.changedTouches[0].pageX), initialScrollY + initialClickY - (mouse?e.clientY:e.changedTouches[0].pageY));
	},
  endMove: function() {
		MouseMoveMap.removeEvent( "mousemove", MouseMoveMap.doMove);
	  MouseMoveMap.removeEvent( "mouseup", MouseMoveMap.endMove);
		MouseMoveMap.removeEvent( "touchmove", MouseMoveMap.doMove);
	  MouseMoveMap.removeEvent( "touchend", MouseMoveMap.endMove);
	},
}
MouseMoveMap.init()
 
// ******************************************************************************************************** corner

var Corner = {
  
  init: function(n) {
    var self=this
    $('#corner').click(function(){
      EditorSetting.setEditMode()
    });
    this.openCorner(0)
	},
  openCorner: function(n) {

    $('#rond').show('fast'); 
    var tab = [
      {"right":220, "top":5},
      {"right":160, "top":5},
      {"right":125, "top":55},
      {"right":70, "top":85},
      {"right":10, "top":100},
      {"right":10, "top":160},
    ]
    for (var k in tab)
      $('.rond'+k).animate({ 'top':tab[k].top+'px', 'right':tab[k].right+'px', "z-index":"11" },(n||'fast'));
    $('#corner').animate({"height":"90px", "width":"150px"},(n||'fast'));
	},
  closeCorner: function() {
    $('.rond1, .rond2, .rond3, .rond4').animate({ 'margin-left':'100%', 'margin-top':'0%', },'fast');
    $('#rond').hide('fast'); 
    $('#corner').animate({ "height":"50px", "width":"130px"},'fast');
	},
}

  //*******************************************************************************************************   search

var SearchBox = {
  
  init: function() {
    var self=this    
    $( "#search" )
      .on("mouseover", function() { self.open() })
      .on("mouseleave", function() { self.close(this.value) })
      .on("focusout", function() { self.close(this.value) })
      .on("input", function() { self.search(this.value) })		
	},
  open: function() {
    $("#search").animate({'width':'300px',"z-index":"7"},500);
  },
  close: function(search) {
    setTimeout(function() { 
      if(search=='' && !$( "#search" ).is(":focus") )
        $("#search").animate({'width':'32px',"z-index":"4"},500); 
    }, 2000);
  },
  search: function(search) {
    var searchReg = new RegExp(search, 'gi');
    for (var k in jsonMap["bubble"]){
      if(jsonMap["bubble"][k])
        $("#"+jsonMap["bubble"][k]["id"] ).css('background',(search!=''&&jsonMap["bubble"][k]["title"].match(searchReg)?'red':'#'+jsonMap["bubble"][k]["color"]))
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
  
function cleanHTML(input) {
  // 1. remove line breaks / Mso classes
  var stringStripper = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g; 
  var output = input.replace(stringStripper, ' ');
  // 2. strip Word generated HTML comments
  var commentSripper = new RegExp('<!--(.*?)-->','g');
  var output = output.replace(commentSripper, '');
  //var tagStripper = new RegExp('<(/)*(strong|html|body|div|object|img|ol|ol|li|ul|fieldset|form||tfoot|thead|th|td|menu|output|audio|video|pre|t|code|meta|link|span|\\?xml:|st1:|o:|font)(.*?)>','gi');
  var tagStripper = new RegExp('<(/)*>','gi');
  // 3. remove tags leave content if any
  output = output.replace(tagStripper, '');
  // 4. Remove everything in between and including tags '<style(.)style(.)>'
  var badTags = ['style', 'script','applet','embed','noframes','noscript'];
  
  for (var i=0; i< badTags.length; i++) {
    tagStripper = new RegExp('<'+badTags[i]+'.*?'+badTags[i]+'(.*?)>', 'gi');
    output = output.replace(tagStripper, '');
  }
  // 5. remove attributes ' style="..."'
  var badAttributes = ['style', 'start'];
  for (var i=0; i< badAttributes.length; i++) {
    var attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"','gi');
    output = output.replace(attributeStripper, '');
  }
  return output;
}
  