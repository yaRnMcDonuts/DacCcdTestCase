#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Instancing.glsllib"
#import "Common/ShaderLib/Skinning.glsllib"

#import "MatDefs/ShaderLib/NoiseLib.glsllib"

uniform float g_Time;
uniform float m_ImpactPercent;

varying vec3 vertCoords;

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

varying vec4 wPosition;


varying vec4 vertColor;



uniform vec3 m_BeamDirection;
uniform float m_ImpactCoordStart;
uniform float m_ImpactCoordEnd;


float alpha;

void main(){


   
   float speed = 0.31;
   float beamVariationTime = speed * g_Time;

    vec4 color = vec4(1.0);
    float timeDirection = mod((beamVariationTime), 1);



    #ifdef HAS_COLORMAP
 //       vec2 newSpot = vec2(xCoord , yCoord);


            color = texture2D(m_ColorMap,texCoord1);
    #else 
        color = m_Color;
    #endif

    color = m_Color;
    alpha = color.a;
    float newAlpha = 0;
    
    float distFromMid = (0.5 - texCoord1.x); //one line with this noise layer
    
  //  distFromMid = abs(0.5 - texCoord1.x) * 2;  //2 symettrical lines for one layer - can set high line thicknesses to create one big, wavey, symetterical line of the 2 overlapping
    
    
    
    newAlpha = 1.0 - (distFromMid);
    newAlpha = min(newAlpha, 1.0);
  


 //   color.rgb = vec3(m_Color * newAlpha * newAlpha);
     color.rgb = vec3(m_Color);

    #ifdef HAS_LIGHTMAP
        #ifdef SEPARATE_TEXCOORD
            color.rgb *= texture2D(m_LightMap, texCoord2).rgb;
        #else
            color.rgb *= texture2D(m_LightMap, texCoord1).rgb;
        #endif
    #endif
    
    //layers render in order, with the last layer rendering over top of all previous layers
    //
    
    vec4 currentPixelColor = vec4(0.0);
    
    #ifdef LAYER_0
    
        int layerBeamType = m_LayerBeamType_0;
        
        int layerBeamWidth = m_LayerBeamWidth_0;
        
        float noiseValue = 0;
        int octaveCount = 0;
        #ifdef LAYER_0_PERLINEOCTAVE_A
        
            octaveCount++;
        #endif
        #ifdef LAYER_0_PERLINEOCTAVE_B
        
            octaveCount++;
        #endif
    
    #endif


 float noiseVal;
 
 //generate up to 3 (or make it more?) noise octaves per beam layer
 
 vec2 noiseInputVec = vec2(texCoord1.y, texCoord1.y - beamVariationTime );

 float noiseVal0 = pnoise(noiseInputVec, 2.5); 
 float noiseVal1 = pnoise(noiseInputVec, 0.25); 
 float noiseVal2 = pnoise(noiseInputVec, 0.125); 
 
 
 
 //vec3 noiseInputWorldVec = vec3(wPosition);
 //noiseInputWorldVec.x -= beamVariationTime * 5;
 
// noiseVal0 = Noise3D(noiseInputWorldVec, 2.5); 
// noiseVal1 = Noise3D(noiseInputWorldVec, 0.25); 
// noiseVal2 = Noise3D(noiseInputWorldVec, 0.125); 
 
 //apply magnitude of each octave
 noiseVal0 *= 1.8; 
 noiseVal1 *= 0.5;
 noiseVal2 *= 0.8;
 //note that the total value of all octaves magnitudes should not be higher than the BeamPlane width, otherwise the beams will clip off of the edge of teh plane
 
 noiseVal = noiseVal0 + noiseVal1 + noiseVal2;
 
 noiseVal = noiseVal / 3.1;
 
 noiseVal = 0.5 - noiseVal; 
 
 //noiseVal = noiseVal / 1.55;
 //noiseVal *= 2;
 
 noiseVal *= 0.05;
    
  //  noiseVal *= 3.15; //note that 1.15 is the current width of the test BeamPlane in lesserNecromancy spell - eventually update to use uniform and then also account for each layer of noise's scale factor
     
     
     if(texCoord1.x < 0.5){ //this gets rid of the double symettrical lines - but will require some offsetting to make sure it is centered -- not anymore nvm
       //\  discard;
         }
     else{

     }


    float diffFromMid = noiseVal - distFromMid;
    
    float halfLineWidth = 0.11;
//note that everything is currently scaled solely by the texCoords now - so beams of different width (and length maybe) will alter based on these
    // dimensions, until they are passed in as a uniform so that the user set params for each noise layer can be put into
    // world units based on the size using  tex coords of each pixel    
    
    if(diffFromMid <= halfLineWidth && diffFromMid >= -1 * halfLineWidth){
            diffFromMid = abs(diffFromMid);
            
            float beamFallOffDistanceThresholdPercent = 0.885f;
            
            float beamFallOffDistance = (1 - beamFallOffDistanceThresholdPercent) * halfLineWidth;
            
            if(diffFromMid >=  beamFallOffDistance){
                
                //add the small 0.0000001 to avoid zero divisions
                float fallOffPercent = (beamFallOffDistance + 0.00001) / (diffFromMid + 0.00001);
                
                float fallOffAlpha = fallOffPercent;
                color.a = fallOffAlpha;
                #ifdef FallOffColor_0
                    //also blend to a certain color as the edges fade to full transparency
                #endif
                
                color.rgb = mix(color.rgb, vec3(0.023, 0.0322, 0.01), 1 - fallOffPercent);
                
                color.a *= alpha;
                
            }
                
            
        }
    else{
            discard; //gets rid of anything but the lines
    }
                 
                 
  


    #if defined(DISCARD_ALPHA)


        if(color.a < m_AlphaDiscardThreshold){
            discard;
        }
    #endif

    if(texCoord1.y >= m_ImpactCoordEnd){
        float distToEnd = 1 - m_ImpactCoordEnd;
       

    }
   else if(texCoord1.y > m_ImpactCoordStart){
        float mixPct = (texCoord1.y - m_ImpactCoordStart );
        float impactZoneDist = m_ImpactCoordEnd - m_ImpactCoordStart ;
        mixPct = mixPct / (impactZoneDist);

        max(mixPct, 1.0);

    //    mixPct *= 1.2;

        if(mixPct > 1){
            float diff = mixPct - 1.0;
            float pct = diff / 0.2;
            pct = 1 - pct;
            mixPct = pct * pct * pct;

            
        
      
        }

     //   color = mix(color, vec4(1.0, 0.8, 0.9, 0.85) , mixPct);
    }


    gl_FragColor = color;

}


