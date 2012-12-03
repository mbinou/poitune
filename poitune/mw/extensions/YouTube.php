<?php
# YouTube Videos
# 
# Tag:
#   <youtube>v</youtube>
# Ex:
#   from url http://www.youtube.com/watch?v=WZpeeRSk-0A
#   <youtube>WZpeeRSk-0A</youtube>
# 
# Enjoy!

$wgExtensionFunctions[] = 'wfYouTube';
$wgExtensionCredits['parserhook'][] = array(
        'name' => 'YouTube',
        'description' => 'Display YouTube video',
        'author' => 'Sylvain Machefert',
        'url' => 'http://www.mediawiki.org/wiki/Extension:YouTube_(Iubito)'
);
 
function wfYouTube() {
        global $wgParser;
        $wgParser->setHook('youtube', 'renderYouTube');
}
 
# The callback function for converting the input text to HTML output
function renderYouTube($input) {
        //$input = "WZpeeRSk-0A"
 
        $width = 425;
        $height = 350;
 
        //Validate the video ID
        if (preg_match('%[^A-Za-z0-9_!\#\\-]%',$input)) {
                return 'YouTube : bad video ID !';
        }
 
        $url = 'http://www.youtube.com/v/' . $input;
        $output =
                Xml::openElement( 'object',
                        array(
                                'width' => $width,
                                'height' => $height ) ) .
                Xml::openElement( 'param',
                        array(
                                'name' => 'movie',
                                'value' => $url ) ) .
                '</param>' .
                Xml::openElement( 'embed',
                        array(
                                'src' => $url,
                                'type' => 'application/x-shockwave-flash',
                                'wmode' => 'transparent',
                                'width' => $width,
                                'height' => $height ) ) .
                '</embed>' .
                '</object>';
 
        return $output;
}

