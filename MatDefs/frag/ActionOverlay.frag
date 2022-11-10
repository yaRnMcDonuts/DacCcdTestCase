
#import "Common/ShaderLib/GLSLCompat.glsllib"

#if defined(HAS_GLOWMAP) || defined(HAS_COLORMAP) || (defined(HAS_LIGHTMAP) && !defined(SEPARATE_TEXCOORD))
    #define NEED_TEXCOORD1
#endif

#if defined(DISCARD_ALPHA)
    uniform float m_AlphaDiscardThreshold;
#endif

uniform vec4 m_Color;
uniform sampler2D m_ColorMap;
uniform sampler2D m_LightMap;

varying vec2 texCoord1;
varying vec2 texCoord2;

varying vec4 vertColor;

varying vec3 vertCoords;



uniform vec4 m_CooldownColor;
uniform vec4 m_EmptyColor;

#define PI 3.14159
float ATan2(vec2 dir){
    float angle = asin(dir.x) > 0 ? acos(dir.y) : -acos(dir.y);
    return angle;
}



float alpha = 1;
#ifdef HAS_GRADIENT_TEXTURE
    uniform sampler2D m_GradientTexture;
#endif

#ifdef ON_COOLDOWN
    uniform vec3 m_CurrentCooldownPercent;
#endif


void main(){
    vec4 color = vec4(0.1);

    #ifdef HAS_COLORMAP
        color = texture2D(m_ColorMap, texCoord1);     
    #endif

    #ifdef HAS_VERTEXCOLOR
        color *= vertColor;
    #endif

    #ifdef HAS_COLOR
        color *= m_Color;
    #endif



    #if defined(DISCARD_ALPHA)
        if(color.a < m_AlphaDiscardThreshold){
           discard;
        }
    #endif 
    
    
    #ifdef SECONDARY_INPUT_AVAILABLE
    
    #endif
    
    
    #ifdef NO_MANA
    
    #endif
    
    #ifdef NO_ENERGY
    
    #endif
    
    
    #ifdef DESATURATION
        vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color.rgb));
        color.rgb = vec3(mix(color.rgb, gray, m_DesaturationValue));       
    #endif
//    #ifdef ON_COOLDOWN
        
        
        float currCdPct = m_CurrentCooldownPercent.x;
        
        #if defined(HAS_GRADIENT_TEXTURE)
        
            float gradientVal = texture2D(m_GradientTexture, texCoord1).r;
            
        //    vec4 col = (currCdPct >= gradientVal) ? m_CooldownColor : vec4(0.0); 
            
            
            
                 //hard coded at 50%...
            if( currCdPct <=  gradientVal) {
                color.rgba = m_CooldownColor;
           //     color.rgba = vec4(gradientVal, gradientVal, gradientVal, 1.0); //display the gradient value on screen
                
            } else {
                color.rgba = vec4(0.0); 
            }
        
        #else
            vec3 dirToPixelPoint = normalize(vertCoords.xyz);  
            float rads = ATan2(vec2(dirToPixelPoint.x, dirToPixelPoint.z)); // though your code indicates maybe switch .z for .y

            if(rads < 0){
                rads += PI;
                rads *= 0.5;

                rads = PI - rads;

            }else{
                rads = PI - rads;
                rads *= 0.5;
            }    



            float coolDownRads = currCdPct * PI;  


            if( rads > coolDownRads ) {
                color.rgba = m_CooldownColor;
            } else {
                color.rgba = m_EmptyColor;
            }

        #endif
        

        
        
    
 //   #endif

   // alpha = 0.0;


 


    gl_FragColor = color;
}