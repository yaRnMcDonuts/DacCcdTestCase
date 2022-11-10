#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "MatDefs/ShaderLib/NoiseLib.glsllib"

#if defined(HAS_GLOWMAP) || defined(HAS_COLORMAP) || (defined(HAS_LIGHTMAP) && !defined(SEPARATE_TEXCOORD))
    #define NEED_TEXCOORD1
#endif

#if defined(DISCARD_ALPHA)
    uniform float m_AlphaDiscardThreshold;
#endif

uniform bool m_Horizontal;

uniform float g_Time;

uniform float m_Percent;
uniform bool vertical;

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
        float timeMoveAmt = g_Time * 0.007f;
        
        
        vec2 movedCoords = vec2(mod(texCoord1.x - timeMoveAmt, 1), texCoord1.y);
        color = texture2D(m_ColorMap, movedCoords);     
    #endif

    #ifdef HAS_VERTEXCOLOR
        color *= vertColor;
    #endif

    #ifdef HAS_COLOR
      //  color *= m_Color;  //commented out because color is used as the fade color for the texture
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

    float pixelTexCoordValue;
   if(m_Horizontal){
       pixelTexCoordValue = texCoord1.x;
       
   }
   else{
       pixelTexCoordValue = texCoord1.y;
    }

    if(pixelTexCoordValue < 1 - m_Percent){
        color.rgb = vec3(0.03, 0.033, 0.033);
        
        
        
    }
    else{
        #ifdef USENOISE
            float maxFreq = 0.733;
            
            float timeSpeed = 0.035 + (m_Percent * 0.33); 
            
           float timeVar = mod(g_Time * timeSpeed, 2); 
           
           if(timeVar > 1){ //reverse the values from 1-2 to make it go back 1-0 so the values are flush and doesnt jump from 1/2 back to 0 drastically
            
                timeVar = 2 - timeVar;
            
            }
               
            
           float noiseFreq = mod(timeVar, maxFreq);


           if(noiseFreq > (maxFreq * 0.5)){
               noiseFreq = (maxFreq - noiseFreq);
            }

              noiseFreq += 0.9;
           
           

              float noiseVal = Noise3D(vec3(texCoord1.x,  texCoord1.y , texCoord1.x + timeVar), noiseFreq);


              vec3 fadeCol = vec3(m_Color.rgb);
              
              fadeCol = color.rgb;

              color.rgb += noiseVal * fadeCol;


        #else
       
        #endif
        }

   color.a *= alpha;
   


  //  color.a = texCoord1.x;

    gl_FragColor = color;
}