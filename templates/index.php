<?php
  script('mindmap_app', 'html2canvas.min');
  script('mindmap_app', 'mindmap');
  style('mindmap_app', 'mindmap');

  ini_set('display_errors', 1);

  if(isset($_GET['url'])){
    $url=htmlentities(strip_tags($_GET['url']));
    if (!preg_match('/http/', $url)){
      $url='https://'.$url;
    }
    die('<body style="margin:0;"><iframe src="'.$url.'" style="width: 100%; height: 100%; border:0;"></body>');
  }
?>

<!-- right click menu when bubble is clicked -->  
<div class="rightMenu" id="rightMenuBubble" align="center">    
  <button id="addBubble" class="icon icon-add-white"></button>
  <button id="addLinkBegin" class="icon icon-public-white"></button>
  <button id="removeBubble" class="icon icon-delete-white"></button>
  <div class="bpColor"></div>
</div>
  
<!-- right click menu when line is clicked  -->  
<div class="rightMenu" id="rightMenuLine" align="center">
  <button id="removeLine" class="icon icon-delete-white"></button>
  <div class="bpRightMenu">
    <div class="bpColorMini"></div>
  </div>
  <br>
  <input type="text">
</div>

<!--************************************************************************************************************************************-->

<!-- corner menu with save/update/search/... -->
<div id="corner" title="<?php echo p($l->t('Edit')); ?>">MindMap</div>
<button id="close-button">×</button>
<div id="rond">	
  <div id="prevAction" class="rond icon icon-confirm-white previous-icon rond0" title="<?php echo p($l->t('Previous')); ?>"></div>
  <div id="nextAction" class="rond icon icon-confirm-white rond1" title="<?php echo p($l->t('Next')); ?>"></div>
  <div id="exportMap" class="rond icon icon-external-white rond2" title="<?php echo p($l->t('Export')); ?>"></div>
  <div id="openColorMenu" class="rond icon icon-settings-white rond3" title="<?php echo p($l->t('Setting')); ?>"></div>
  <div id="saveMindMap" class="rond icon save-icon rond4 " title="<?php echo p($l->t('Save')); ?>"></div>
  <!--div class="rond icon color-icon rond5" title="Save"></div-->
</div> 

<input type="search" id="search" placeholder="<?php echo p($l->t('Search')); ?>" val=""></input>
  
  <!--************************************************************************************************************************************-->
  
<div class="colorMenu">
  <div class="Map-bubble" style="top:40px; left:10%; min-width:10%;" align="center"><p class="Map-bubble-title" style="font-size:14px;"><?php echo p($l->t('Bubble')); ?></p></div>
  <div class='formLine' style="width:70%; margin: 35px 15% 10px 15%;"></div>
  <div class="Map-bubble" style="top:40px; right:10%; min-width:10%;" align="center"><p class="Map-bubble-title" style="font-size:14px;"><?php echo p($l->t('Line')); ?></p></div>
  <div style="width:90%; margin:0 5% 2% 5%;">
    <h3 style="margin:1%;"><?php echo p($l->t('Bubble')); ?></h3>
    <div class="settingBubbleColor"></div>
    <h3 style="margin:1%;"><?php echo p($l->t('Line')); ?></h3>
    <div class="settingLineColor"></div>
  </div>
  <hr><br>
  <button id="openCodePreview"><?php echo p($l->t('Plain text editor')); ?></button>
</div> 
<div id="codePreviewArea">
  <button id="quittCodePreview" class="rond icon icon-close-white" title="<?php echo p($l->t('Back')); ?>"></button>
  <button id="saveCodePreview" class="rond icon icon-checkmark-white" title="<?php echo p($l->t('Save')); ?>"></button>
  <br>
  <textarea></textarea>
</div>
<div id="imagePreview">
  <button id="exportPng" class="rond icon icon-picture-white" title="<?php echo p($l->t('Export jpg file.')); ?>"></button>
  <button id="exportHtml" class="rond icon icon-timezone-white" title="<?php echo p($l->t('Export html file.')); ?>"></button>
  <img>
</div>
  
  <!--************************************************************************************************************************************-->

  
  <div class="message"><p></p></div> <!-- msg box -->
  <div id="quitMenu"></div> <!-- quitt menu box -->
  <div id="loading" class="icon-loading"></div>

  <iframe  id="iframePage" src=""></iframe> <!-- iframe to display another web site -->
  <div id="map-editor-quitUrl" class="icon icon-close-white"></div>

  <div id="map-editor" align="center">
    <input type="text" id="map-editor-title" readonly="true">    
    
    <div id="map-editor-commands"></div>
    <div id="map-editor-color"></div>    
  
    <div id="map-editor-text" contentEditable="false"></div>
    <div id="map-edito-url-box">
      <input type="text" id="map-editor-url" placeholder="<?php echo p($l->t('Web site')); ?>" readonly="true">
      <div id="map-editor-loadUrl" class="icon icon-confirm"></div>
      <a id="map-editor-link" href="" target="blank" hidden></a>
    </div>    
    <div id="map-editor-hide"></div>
  </div>

  <div id="nav-bar">
    <input type="range"/>
    <button class="icon-toggle"></button>
  </div>  
 
  <div id="mapBox"></div>  
