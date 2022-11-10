
#import "Common/ShaderLib/GLSLCompat.glsllib"

#if defined(HAS_GLOWMAP) || defined(HAS_COLORMAP) || (defined(HAS_LIGHTMAP) && !defined(SEPARATE_TEXCOORD))
    #define NEED_TEXCOORD1
#endif

#if defined(DISCARD_ALPHA)
    uniform float m_AlphaDiscardThreshold;
#endif

uniform sampler2D m_BarMap;
uniform float m_Health;
uniform float m_Mana;

uniform vec4 m_Color;
uniform sampler2D m_ColorMap;
uniform sampler2D m_LightMap;

varying vec2 texCoord1;
varying vec2 texCoord2;

varying vec4 vertColor;

varying vec3 vertCoords;

float alpha = 1;

void main(){
    vec4 color = vec4(1.0);

    #ifdef HAS_COLORMAP
        color = texture2D(m_ColorMap, texCoord1);     
    #endif

    #ifdef HAS_VERTEXCOLOR
        color *= vertColor;
    #endif

    #ifdef HAS_COLOR
        color *= m_Color;
    #endif

    #ifdef HAS_LIGHTMAP
        #ifdef SEPARATE_TEXCOORD
            color.rgb *= texture2D(m_LightMap, texCoord2).rgb;
            texCoord1 = texCoord2;
        #else
            color.rgb *= texture2D(m_LightMap, texCoord1).rgb;
        #endif
    #endif

    #if defined(DISCARD_ALPHA)
        if(color.a < m_AlphaDiscardThreshold){
           discard;
        }
    #endif


    vec4 grayColor = texture2D(m_BarMap, texCoord1);
    float pctOnBar = grayColor.g;
    
    float healthX = .695 - ((texCoord1.x  -0.248)/ .7);
    float colVar = healthX /4;

    if(grayColor.a < .02){
    //    discard; // hides frame
    }
    else{
        if(grayColor.r > .03 ){ // hides health bars
        //    discard;
        }
         if(grayColor.b > .03  ){ // hides mana bars
      //      discard;
        }
        if(grayColor.g > .05){
            
   //         alpha = .4; //dims the level circle

     //       discard;// removes the level cricel;
        }
    }

    if(grayColor.a > .02 && grayColor.r > .1){
        if(healthX  < m_Health  && m_Health > .01){
            color = vec4(.2 + colVar, .01, .01, 1);
        }
        else{
            color = vec4(.04, .03, .03, .1);
        }
    }

    if(grayColor.a > .02 && grayColor.b > .1){
        if(healthX  < m_Mana  && m_Mana > .01){
            color = vec4(.01, .01, .2 + colVar, 1);
        }
        else{
            color = vec4(.02, .02, .03, .1);
        }
    }

   color.a *= alpha;


    gl_FragColor = color;
}