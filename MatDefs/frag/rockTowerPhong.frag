#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Parallax.glsllib"
#import "Common/ShaderLib/Optics.glsllib"
#ifndef VERTEX_LIGHTING
    #import "Common/ShaderLib/BlinnPhongLighting.glsllib"
    #import "Common/ShaderLib/Lighting.glsllib"
#endif
#import "MatDefs/ShaderLib/AfflictionLib.glsllib"
#import "MatDefs/ShaderLib/NoiseLib.glsllib"


#ifdef AFFLICTIONTEXTURE
    uniform sampler2D m_AfflictionAlphaMap;
#endif

#ifdef TILEWIDTH
    uniform float m_TileWidth;
#endif

#ifdef TILELOCATION
    uniform vec3 m_TileLocation;
#endif

uniform float g_Time;
uniform int m_GlowPhase;
uniform int m_RockId;

#ifdef EMISSIVE
    uniform vec4 m_Emissive;
    uniform float m_EmissivePower;
    uniform float m_EmissiveIntensity;
#endif


#ifdef EMISSIVEMAP
    uniform sampler2D m_EmissiveMap;
#endif

varying vec2 texCoord;
#ifdef SEPARATE_TEXCOORD
  varying vec2 texCoord2;
#endif

varying vec3 AmbientSum;
varying vec4 DiffuseSum;
varying vec3 SpecularSum;

#ifndef VERTEX_LIGHTING
  uniform vec4 g_LightDirection;
  //varying vec3 vPosition;
  varying vec3 vViewDir;
  varying vec4 vLightDir;
  varying vec3 lightVec;
#else
  varying vec2 vertexLightValues;
#endif

#ifdef DIFFUSEMAP
  uniform sampler2D m_DiffuseMap;
#endif

#ifdef SPECULARMAP
  uniform sampler2D m_SpecularMap;
#endif

#ifdef PARALLAXMAP
  uniform sampler2D m_ParallaxMap;  
#endif
#if (defined(PARALLAXMAP) || (defined(NORMALMAP_PARALLAX) && defined(NORMALMAP))) && !defined(VERTEX_LIGHTING) 
    uniform float m_ParallaxHeight;
    varying vec3 vViewDirPrlx;
#endif

#ifdef LIGHTMAP
  uniform sampler2D m_LightMap;
#endif
  
#ifdef NORMALMAP
  uniform sampler2D m_NormalMap;   
#else
  varying vec3 vNormal;
#endif

#ifdef ALPHAMAP
  uniform sampler2D m_AlphaMap;
#endif

#ifdef COLORRAMP
  uniform sampler2D m_ColorRamp;
#endif

uniform float m_AlphaDiscardThreshold;

#ifndef VERTEX_LIGHTING
    uniform float m_Shininess;
    #ifdef USE_REFLECTION 
        uniform float m_ReflectionPower;
        uniform float m_ReflectionIntensity;
        varying vec4 refVec;

        uniform ENVMAP m_EnvMap;
    #endif
#endif

varying vec3 wPosition; 

void main(){
    vec2 newTexCoord;
     
    #if (defined(PARALLAXMAP) || (defined(NORMALMAP_PARALLAX) && defined(NORMALMAP))) && !defined(VERTEX_LIGHTING) 
     
       #ifdef STEEP_PARALLAX
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = steepParallaxOffset(m_NormalMap, vViewDirPrlx, texCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = steepParallaxOffset(m_ParallaxMap, vViewDirPrlx, texCoord, m_ParallaxHeight);         
           #endif
       #else
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = classicParallaxOffset(m_NormalMap, vViewDirPrlx, texCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = classicParallaxOffset(m_ParallaxMap, vViewDirPrlx, texCoord, m_ParallaxHeight);
           #endif
       #endif
    #else
       newTexCoord = texCoord;    
    #endif
    
   #ifdef DIFFUSEMAP
      vec4 diffuseColor = texture2D(m_DiffuseMap, newTexCoord);
    #else
      vec4 diffuseColor = vec4(1.0);
    #endif

    float alpha = DiffuseSum.a * diffuseColor.a;
    #ifdef ALPHAMAP
       alpha = alpha * texture2D(m_AlphaMap, newTexCoord).r;
    #endif
    #ifdef DISCARD_ALPHA
        if(alpha < m_AlphaDiscardThreshold){
            discard;
        }
    #endif


    vec3 afflictionVector = vec3(1.0, 0.0, 0.0);
    #if defined(AFFLICTIONTEXTURE) && defined(TILEWIDTH) && defined(TILELOCATION)
        vec2 tileCoords;
        float xPos, zPos;

        vec3 locInTile = (wPosition - m_TileLocation);

         locInTile += vec3(m_TileWidth/2, 0, m_TileWidth/2);

         xPos = (locInTile.x / m_TileWidth);
         zPos = 1 - (locInTile.z / m_TileWidth);
        
        tileCoords = vec2(xPos, zPos);

        afflictionVector = texture2D(m_AfflictionAlphaMap, tileCoords).rgb;

    #endif

    float livelinessValue = afflictionVector.r;
//    float afflictionValue = afflictionVector.g; // idea maybe? 
//    float windValue = afflictionVector.b; // idea maybe? 

float deathVar = (1.0 - (livelinessValue));


diffuseColor = alterStoneLiveliness(diffuseColor, livelinessValue);



    // ***********************
    // Read from textures
    // ***********************
    #if defined(NORMALMAP) && !defined(VERTEX_LIGHTING)
      vec4 normalHeight = texture2D(m_NormalMap, newTexCoord);
      //Note the -2.0 and -1.0. We invert the green channel of the normal map, 
      //as it's complient with normal maps generated with blender.
      //see http://hub.jmonkeyengine.org/forum/topic/parallax-mapping-fundamental-bug/#post-256898
      //for more explanation.
      vec3 normal = normalize((normalHeight.xyz * vec3(2.0,-2.0,2.0) - vec3(1.0,-1.0,1.0)));
      #ifdef LATC
        normal.z = sqrt(1.0 - (normal.x * normal.x) - (normal.y * normal.y));
      #endif      
    #elif !defined(VERTEX_LIGHTING)
      vec3 normal = vNormal;
      #if !defined(LOW_QUALITY) && !defined(V_TANGENT)
         normal = normalize(normal);
      #endif
    #endif

    #ifdef SPECULARMAP
      vec4 specularColor = texture2D(m_SpecularMap, newTexCoord);
    #else
      vec4 specularColor = vec4(1.0);
    #endif

    #ifdef LIGHTMAP
       vec3 lightMapColor;
       #ifdef SEPARATE_TEXCOORD
          lightMapColor = texture2D(m_LightMap, texCoord2).rgb;
       #else
          lightMapColor = texture2D(m_LightMap, texCoord).rgb;
       #endif
       specularColor.rgb *= lightMapColor;
       diffuseColor.rgb  *= lightMapColor;
    #endif

    #ifdef VERTEX_LIGHTING
       vec2 light = vertexLightValues.xy;
       #ifdef COLORRAMP
            diffuseColor.rgb  *= texture2D(m_ColorRamp, vec2(light.x, 0.0)).rgb;
            specularColor.rgb *= texture2D(m_ColorRamp, vec2(light.y, 0.0)).rgb;
            light.xy = vec2(1.0);
       #endif

       gl_FragColor.rgb =  AmbientSum     * diffuseColor.rgb + 
                           DiffuseSum.rgb * diffuseColor.rgb  * vec3(light.x) +
                           SpecularSum    * specularColor.rgb * vec3(light.y);
    #else
       vec4 lightDir = vLightDir;
       lightDir.xyz = normalize(lightDir.xyz);
       vec3 viewDir = normalize(vViewDir);
       float spotFallOff = 1.0;

       #if __VERSION__ >= 110
        // allow use of control flow
        if(g_LightDirection.w != 0.0){
       #endif
          spotFallOff =  computeSpotFalloff(g_LightDirection, lightVec);
       #if __VERSION__ >= 110
          if(spotFallOff <= 0.0){
              gl_FragColor.rgb = AmbientSum * diffuseColor.rgb;
              gl_FragColor.a   = alpha;
              return;
          }
         }        
       #endif

       vec2   light = computeLighting(normal, viewDir, lightDir.xyz, lightDir.w * spotFallOff, m_Shininess) ;
       #ifdef COLORRAMP
            diffuseColor.rgb  *= texture2D(m_ColorRamp, vec2(light.x, 0.0)).rgb;
            specularColor.rgb *= texture2D(m_ColorRamp, vec2(light.y, 0.0)).rgb;
            light.xy = vec2(1.0);
       #endif

       // Workaround, since it is not possible to modify varying variables
       vec4 SpecularSum2 = vec4(SpecularSum, 1.0);
       #ifdef USE_REFLECTION
            vec4 refColor = Optics_GetEnvColor(m_EnvMap, refVec.xyz);

            // Interpolate light specularity toward reflection color
            // Multiply result by specular map
            specularColor = mix(SpecularSum2 * light.y, refColor, refVec.w) * specularColor;

            SpecularSum2 = vec4(1.0);
            light.y = 1.0;
       #endif

       gl_FragColor.rgb =  AmbientSum       * diffuseColor.rgb  +
                           DiffuseSum.rgb   * diffuseColor.rgb  * vec3(light.x) +
                           SpecularSum2.rgb * specularColor.rgb * vec3(light.y);
    #endif

//wemissieness for the rock tower glow

    #if defined(EMISSIVE) || defined (EMISSIVEMAP)
        #ifdef EMISSIVEMAP
            vec4 emissive = texture2D(m_EmissiveMap, newTexCoord);
            emissive *= m_Emissive; //applies emissive color to the emissive map
        #else
            vec4 emissive = m_Emissive;
        #endif
        
        if(livelinessValue > 0.1){
            emissive *= livelinessValue *livelinessValue;

        }
        else{ //ignore the base emissiveMap for texture below half death
            emissive *= .01;
        }

 //    (  \/ offsets the flash / effect for each tower  )
        float timeOffset = (m_RockId * 0.2);

        float phaseFlashTime = 0.4085+ (5 - m_GlowPhase) * 0.25;
        float phaseSpeed = g_Time * (0.75 + (.075 * m_GlowPhase)) + timeOffset;
                                     
        float glowTime = mod(g_Time* .7 + timeOffset, phaseFlashTime);
        float texDist;

        texDist =  Noise3D(wPosition.xyz +vec3(phaseSpeed * 3.5), .6);

        if(m_RockId >= m_GlowPhase){ // pulse color in and out for active layer, and lightly for higher layers
           
            if(glowTime > phaseFlashTime / 2){
                glowTime = phaseFlashTime - glowTime;
            }

            if(m_RockId == m_GlowPhase){
                emissive *= vec4(1.6);
                
                //make active layer slightly whiter with desaturation
                 vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), emissive.rgb)); 
                emissive = vec4(mix(emissive.rgb, gray, 0.64), 1.0);

            }
            else { 
                float phaseVar = m_RockId - m_GlowPhase;
                emissive *= vec4(.4 - (.03 * phaseVar));

                
            }
            emissive *= glowTime * (7 / phaseFlashTime);
            
        }
        else{
            //smooth noise swirl for colors on the upgraded blocks
            
            emissive *= vec4(0.1 + (texDist / 0.21));
        }

        emissive *= 0.85;

        gl_FragColor += emissive * pow(emissive.a, m_EmissivePower) * m_EmissiveIntensity;
    #endif




    gl_FragColor.a = alpha;
}
