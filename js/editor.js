var MindMap_App = {
  
	currentContext: null,
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
		this.registerFileActions();
	},
  loadEditor: function(i) {
    
     var _self = this;
     this.loadFile(function(t, i) {
       
      var $iframe;
      var viewer = OC.generateUrl('/apps/mindmap_app/');
      $iframe = $(`<iframe id="mindmap-editor" src="`+viewer+`" sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-top-navigation" allowfullscreen="true"/>`);
      $('#content').after($iframe);
      $('html').css('overflow', 'hidden')
     }, function(e) {
      OC.dialogs.alert(e, t("mindmap_app", "An error occurred.")), n.closeEditor()
     })
    },
    closeEditor: function() {
      $('#mindmap-editor, #close-button').remove() 
      $('html').css('overflow', 'auto') 
    },
    loadFile: function(success, failure) {
     var _self = this;
      
     var url = '';
     var sharingToken = '';
     if ($('#isPublic').val() && $('#mimetype').val() === 'application/jm') {
       sharingToken = $('#sharingToken').val();
       url = OC.generateUrl('/apps/files_mindmap/public/{token}', {token: sharingToken});
     } else if ($('#isPublic').val()) {
       sharingToken = $('#sharingToken').val();
       url = OC.generateUrl('/apps/files_mindmap/public/{token}?filename={filename}&dir={dir}', { token: sharingToken, filename: _self.file.name, dir: _self.file.dir})
     } else {
       url = OC.generateUrl('/apps/mindmap_app/ajax/loadfile?filename={filename}&dir={dir}', {filename: _self.file.name, dir: _self.file.dir});
     }
     $.get(url).done(function(e) {
        _self.file.writeable = e.writeable, 
        _self.file.mime = e.mime, 
        _self.file.mtime = e.mtime, 
        _self.file.content = e.filecontents, 
        success(_self.file, e.filecontents)
     }).fail(function(e) {
      failure(JSON.parse(e.responseText).message)
     })
    },
    
 
    /**
     * Handles the trigger or re open editor
     */
    _onReOpenTrigger: function () {
      if ($('#notification').data('reopeneditor') == true) {
        document.title = Texteditor.file.name + ' - ' + Texteditor.oldTitle;
      }
    },
    /**
     * Handles the FileAction click event
     */
    _onEditorTrigger: function (filename, context) {
      this.currentContext = context;
      this.file.name = filename;
      this.file.dir = context.dir;
      this.fileList = context.fileList;
      this.loadEditor( this.file );
        history.pushState({
          file: filename,
          dir: context.dir
        }, 'Editor', '#mindMapEditor');    
    },
    registerFileActions: function() {
      var mimes = this.getSupportedMimetypes(),
			_self = this;

		$.each(mimes, function(key, value) {
			OCA.Files.fileActions.registerAction({
				name: 'Edit',
				mime: value,
				actionHandler: _.bind(_self._onEditorTrigger, _self),
				permissions: OC.PERMISSION_READ,
        icon: function () {
					//return OC.imagePath('files_texteditor', 'text');
				}
			});
			OCA.Files.fileActions.setDefault(value, 'Edit');
		});       
	},
  getSupportedMimetypes: function() {
		return [ 'application/jm' ];
	},
  load: function(success, failure) {
    success(this.file);
	},
  save: function (data, success, failure) {
    // Send the post request
    var _self=this
    var url=''
    var path = this.file.dir + this.file.name;
    if (this.file.dir !== '/') {
      path = this.file.dir + '/' + this.file.name;
    }
    var putObject = {
			filecontents: data,
			path: path,
      mtime: this.file.mtime
		};
    
    if ($('#isPublic').val()){
      putObject.token = $('#sharingToken').val();
      url = OC.generateUrl('/apps/mindmap_app/share/save');
      if ($('#mimetype').val() === 'application/jm') {
        putObject.path = '';
      }
    }else{
      url = OC.generateUrl('/apps/mindmap_app/ajax/savefile');
    }
    $.ajax({
      type: 'PUT',
      url: url,
      data: putObject
    }).done(function (data) {
      try{
        _self.file.mtime=data.mtime
        _self.file.size=data.size
      } catch (e) {}
      success(t('mindmap_app', 'File Saved'));
    }).fail(function (jqXHR) {
			var message;
			try {
				message = JSON.parse(jqXHR.responseText).message;
			} catch (e) {}
			failure(message||t("mindmap_app", "An error occurred."));
		});
  },
};


MindMap_App.NewFileMenuPlugin = {
	attach: function(menu) {
		var fileList = menu.fileList;
		// only attach to main file list, public view is not supported yet
		if (fileList.id !== 'files') {
			return;
		}
		menu.addMenuEntry({
			id: 'mindmap_app',
      displayName: t("mindmap_app", "New MindMap"),
      templateName: t("mindmap_app", "New MindMap.jm"),
      iconClass: "icon-link",
			fileType: 'application/jm',
			actionHandler: function(name) {
				var dir = fileList.getCurrentDirectory();
				fileList.createFile(name).then(function() {
					MindMap_App._onEditorTrigger(
						name,
						{
							fileList: fileList,
							dir: dir
						}
					);
				});
			}
		});
	}
};

OCA.MindMap_App = MindMap_App;
OC.Plugins.register('OCA.Files.NewFileMenu', MindMap_App.NewFileMenuPlugin);

$(document).ready(function(){
	OCA.MindMap_App.init();
  if ($('#isPublic').val() && $('#mimetype').val() === 'application/jm') {
    var sharingToken = $('#sharingToken').val();
    var downloadUrl = OC.generateUrl('/s/{token}/download', {token: sharingToken});
    OCA.MindMap_App.file.name=$('.header-appname').html().trim()
		OCA.MindMap_App.loadEditor(downloadUrl);
	}
});

