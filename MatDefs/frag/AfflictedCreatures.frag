#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/PBR.glsllib"
#import "Common/ShaderLib/Parallax.glsllib"
#import "Common/ShaderLib/Lighting.glsllib"

#import "MatDefs/ShaderLib/AfflictionLib.glsllib"


#ifdef AFFLICTIONTEXTURE
    uniform sampler2D m_AfflictionAlphaMap;
    uniform float m_AfflictionPercent;
    
    uniform float m_AfflictionEmissivePower; //default the intensity of affliction glow to 3 for simplicity, and use the 
#endif


vec3 rgb2hsv(vec3 c){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


varying vec3 scaledModelPos;

#ifdef HSV_SCALAR
   uniform vec3 m_HSVScalar;       
#endif

#ifdef COLOR_CYCLE_EFFECT    
    uniform vec4 m_ColorCycleEffectVector;
#endif

#ifdef SKELETAL_DAMAGE


    uniform float m_SkeletalDamagePercent;
#endif

#ifdef AFFLICTIONEMISSIVECOLOR
    uniform vec4 m_AfflictionEmissiveColor;
#endif

#ifdef AFFLICTIONEMISSIVE
    uniform sampler2D m_AfflictionEmissiveMap;
#endif

uniform float m_DissolveValue;
uniform float m_DissolveColor;

varying vec2 texCoord;
#ifdef SEPARATE_TEXCOORD
  varying vec2 texCoord2;
#endif

varying vec4 Color;

uniform vec4 g_LightData[NB_LIGHTS];
uniform vec4 g_AmbientLightColor;
uniform vec3 g_CameraPosition;

uniform float m_Roughness;
uniform float m_Metallic;

varying vec3 wPosition;    
varying vec3 mPosition;

#ifdef SKELETAL_DAMAGE_PERCENT 
    uniform vec2 m_SkeletalDamagePercent;
#endif


#if NB_PROBES >= 1
  uniform samplerCube g_PrefEnvMap;
  uniform vec3 g_ShCoeffs[9];
  uniform mat4 g_LightProbeData;
#endif
#if NB_PROBES >= 2
  uniform samplerCube g_PrefEnvMap2;
  uniform vec3 g_ShCoeffs2[9];
  uniform mat4 g_LightProbeData2;
#endif
#if NB_PROBES == 3
  uniform samplerCube g_PrefEnvMap3;
  uniform vec3 g_ShCoeffs3[9];
  uniform mat4 g_LightProbeData3;
#endif

#ifdef BASECOLORMAP
  uniform sampler2D m_BaseColorMap;
#endif

#ifdef USE_PACKED_MR
     uniform sampler2D m_MetallicRoughnessMap;
#else
    #ifdef METALLICMAP
      uniform sampler2D m_MetallicMap;
    #endif
    #ifdef ROUGHNESSMAP
      uniform sampler2D m_RoughnessMap;
    #endif
#endif

#ifdef EMISSIVE
    uniform vec4 m_Emissive;
#endif
#ifdef EMISSIVEMAP
    uniform sampler2D m_EmissiveMap;
#endif
#if defined(EMISSIVE) || defined(EMISSIVEMAP)
    uniform float m_EmissivePower;
    uniform float m_EmissiveIntensity;
#endif 

#ifdef SPECGLOSSPIPELINE

  uniform vec4 m_Specular;
  uniform float m_Glossiness;
  #ifdef USE_PACKED_SG
    uniform sampler2D m_SpecularGlossinessMap;
  #else
    uniform sampler2D m_SpecularMap;
    uniform sampler2D m_GlossinessMap;
  #endif
#endif

#ifdef PARALLAXMAP
  uniform sampler2D m_ParallaxMap;  
#endif
#if (defined(PARALLAXMAP) || (defined(NORMALMAP_PARALLAX) && defined(NORMALMAP)))
    uniform float m_ParallaxHeight;
#endif

#ifdef LIGHTMAP
  uniform sampler2D m_LightMap;
#endif
  
#if defined(NORMALMAP) || defined(PARALLAXMAP)
  uniform sampler2D m_NormalMap;   
 
#endif

varying vec4 wTangent;
    

varying vec3 wNormal;

#ifdef DISCARD_ALPHA
uniform float m_AlphaDiscardThreshold;
#endif

uniform float g_Time;


//sun lighting stuff
#ifdef PROBE_COLOR
    uniform vec4 m_ProbeColor;
#endif

//this value is set based on code in agent class and interactive architecture "IndoorLighting" objects that will also raise this value when nearby a node that acts as a fake sun source, such as a window
#ifdef INDOOR_SUN_LIGHT_INTENSITY
    uniform vec3 m_SunLightIntensity;
#endif





float brightestPointLight = 1.0;

void main(){
    
    
    float indoorSunLightExposure = 1.0;//scale this to match R channel of vertex colors

    float timeOfDayScale = 1.0;// this is set based on time of day and is used to scale light probe,. 
                    // IMPORTANT IDEA: after scaling down based on indoor vert colors and the actual time of day, scale BACK UP for anything near a point light (as an indoor light should increase illumination from lightprobe brighter)
      #ifdef PROBE_COLOR
            timeOfDayScale = m_ProbeColor.a; // time of day is stored in alpha value of the ProbeColor vec4. this way the rgb vec3 can be used for scaling probe color
      #endif
      
      
    vec2 newTexCoord;
    vec3 viewDir = normalize(g_CameraPosition - wPosition);

    vec3 norm = normalize(wNormal);
    #if defined(NORMALMAP) || defined(PARALLAXMAP)
        vec3 tan = normalize(wTangent.xyz);
        mat3 tbnMat = mat3(tan, wTangent.w * cross( (norm), (tan)), norm);
    #endif

    #if (defined(PARALLAXMAP) || (defined(NORMALMAP_PARALLAX) && defined(NORMALMAP)))
       vec3 vViewDir =  viewDir * tbnMat;  
       #ifdef STEEP_PARALLAX
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = steepParallaxOffset(m_NormalMap, vViewDir, texCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = steepParallaxOffset(m_ParallaxMap, vViewDir, texCoord, m_ParallaxHeight);         
           #endif
       #else
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = classicParallaxOffset(m_NormalMap, vViewDir, texCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = classicParallaxOffset(m_ParallaxMap, vViewDir, texCoord, m_ParallaxHeight);
           #endif
       #endif
    #else
       newTexCoord = texCoord;    
    #endif
    
    #ifdef BASECOLORMAP
        vec4 albedo = texture2D(m_BaseColorMap, newTexCoord) * Color;
    #else
        vec4 albedo = Color;
    #endif
    
    #ifdef HSV_SCALAR
        
        vec3 colorHSV = rgb2hsv(albedo.rgb);
        
        colorHSV.x += m_HSVScalar.x;        //add hue
        colorHSV.y += m_HSVScalar.y ;        
        colorHSV.z += m_HSVScalar.z;
        
        #ifdef COLOR_CYCLE_EFFECT
            if(m_ColorCycleEffectVector.x > 0){
                colorHSV.x += (g_Time * m_ColorCycleEffectVector.x); // cycle through all hues of color for fancy effect        
            }
            if(m_ColorCycleEffectVector.y > 0){
                colorHSV.y = mod((g_Time * m_ColorCycleEffectVector.y) + 1, 1); //scale saturation over time for fancy effect     
            }
            if(m_ColorCycleEffectVector.z > 0){
                colorHSV.z = mod((g_Time * m_ColorCycleEffectVector.z) + 1, 1); //scale brithness over time for fancy effect
            }
        #endif
        
        colorHSV.x = mod(colorHSV.x + 1, 1);  //keep hue values in range of 0-1 in cases where added values makes it over 1
        
        
        // max and min all final HSV values to be between 0-1
        colorHSV.x = max(colorHSV.x, 0.0);
        colorHSV.x = min(colorHSV.x, 1.0);
        
        colorHSV.y = max(colorHSV.y, 0.0);
        colorHSV.y = min(colorHSV.y, 1.0);
        
        colorHSV.z = max(colorHSV.z, 0.0);
        colorHSV.z = min(colorHSV.z, 1.0);
        
        //convert back to RGB and set albedo's new color
        vec3 newColorFromHSV = hsv2rgb(colorHSV);
        albedo.rgb = newColorFromHSV.xyz;
        
        
    #endif

    #ifdef AFFLICTIONTEXTURE
        vec4 afflictedAlbedo = texture2D(m_AfflictionAlphaMap, newTexCoord); // * Color;
        albedo = mix(albedo, afflictedAlbedo, m_AfflictionPercent);
    #endif

    float alpha = albedo.a;



 

//change hue
//    float hueVar = (1.0 - livelinessValue) * 0.77;
//    albedo.r += albedo.r*hueVar * 1.8;
//    albedo.g -= albedo.g*hueVar;
//    albedo.b -= albedo.b*hueVar*5.0 ;

  
   //desaturate 

//    float deathVar = (1.0 - (livelinessValue));
//    vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), albedo.rgb));
   // gray *= vec3(0.7, 0.5, 0.45);
//    albedo = vec4(mix(albedo.rgb, gray, deathVar), 0.0);


    float skeletalCrackAoMult = 1.0;
    #ifdef IS_SKELETAL
              #ifdef SKELETAL_DAMAGE_PERCENT   

                float noise0 =  Noise3D(scaledModelPos, 0.0225); 
                float noise1 =  Noise3D(scaledModelPos, 0.18); //use this highest frquency one as the peel value for cracks as well
                float noise2 =  Noise3D(scaledModelPos, 0.09);
                float noise3 =  Noise3D(scaledModelPos, 0.045);

                float noiseCrackLineIntensity = noise0 + noise1 + noise2 + noise3;
                
                noiseCrackLineIntensity*= 0.23;

                noiseCrackLineIntensity = smoothstep(0.35 , 0.45, noiseCrackLineIntensity) * (1.0 - smoothstep(0.5, 0.56, noiseCrackLineIntensity)) * (1.0 - smoothstep(0.85, 0.96, noiseCrackLineIntensity));

                float skeletalDamagePercentFloat = m_SkeletalDamagePercent.x;
                
                 if(skeletalDamagePercentFloat >= 1){
                    skeletalDamagePercentFloat = 1;
                }
                
                
                
          
                    
      //       noiseCrackLineIntensity *= m_SkeletalDamagePercent;

                noiseCrackLineIntensity = 1 - noiseCrackLineIntensity;
                
                
                float noisePeelVal = noise2;
                
                noisePeelVal *= noisePeelVal;
                


                    
                
                if(skeletalDamagePercentFloat < noisePeelVal){ //peel back the visibility of the cracks in the bones based on the current damage compared to the highest frequency noise value for the pixel
                    float difference = noise1 - skeletalDamagePercentFloat;
                    
                 
                    
                    
                    float fadeInVal = 1.0; 
                    
                    if(difference <= 0.03){
                 //       fadeInVal = difference /  0.03 ;
                    }
                    
                    
                    
                    
                    skeletalCrackAoMult = noiseCrackLineIntensity * fadeInVal;
                    
                     
                    
                    if(skeletalCrackAoMult < 0.5){
                        
                    //  skeletalCrackAoMult *= 0.95;
                      }
                    
                    albedo.rgb = (vec3(0.38, 0.34, 0.31) + vec3(noise2*0.2)) * skeletalCrackAoMult;
                }

                if(skeletalCrackAoMult <= 0.26){
                      discard;
               }

            
                

            #endif
         #endif
         

  
 //ao in r channel, roughness in green channel, metallic in blue channel!
    vec3 aoRoughnessMetallicValue = vec3(1.0, 1.0, 0.0);
    #ifdef USE_PACKED_MR
        aoRoughnessMetallicValue = texture2D(m_MetallicRoughnessMap, newTexCoord).rgb;
        float Roughness = aoRoughnessMetallicValue.g * max(m_Roughness, 1e-4);
        float Metallic = aoRoughnessMetallicValue.b * max(m_Metallic, 0.0);
    #else
        #ifdef ROUGHNESSMAP
            float Roughness = texture2D(m_RoughnessMap, newTexCoord).r * max(m_Roughness, 1e-4);
        #else
            float Roughness =  max(m_Roughness, 1e-4);
        #endif
        #ifdef METALLICMAP
            float Metallic = texture2D(m_MetallicMap, newTexCoord).r * max(m_Metallic, 0.0);
        #else
            float Metallic =  max(m_Metallic, 0.0);
        #endif
    #endif
    
    #ifdef SKELETAL_DAMAGE_PERCENT   
        if(skeletalCrackAoMult < 1){
            Roughness = 1.0;
            Metallic = 0.0;
        } 
    #endif
  

    #ifdef DISCARD_ALPHA
        if(alpha < m_AlphaDiscardThreshold){
            discard;
        }
    #endif
 
    // ***********************
    // Read from textures
    // ***********************
    #if defined(NORMALMAP)
      vec4 normalHeight = texture2D(m_NormalMap, newTexCoord);
      //Note the -2.0 and -1.0. We invert the green channel of the normal map, 
      //as it's complient with normal maps generated with blender.
      //see http://hub.jmonkeyengine.org/forum/topic/parallax-mapping-fundamental-bug/#post-256898
      //for more explanation.
      vec3 normal = normalize((normalHeight.xyz * vec3(2.0, NORMAL_TYPE * 2.0, 2.0) - vec3(1.0, NORMAL_TYPE * 1.0, 1.0)));
      normal = normalize(tbnMat * normal);
      //normal = normalize(normal * inverse(tbnMat));
    #else
      vec3 normal = norm;
    #endif
    

    #ifdef SPECGLOSSPIPELINE

        #ifdef USE_PACKED_SG
            vec4 specularColor = texture2D(m_SpecularGlossinessMap, newTexCoord);
            float glossiness = specularColor.a * m_Glossiness;
            specularColor *= m_Specular;
        #else
            #ifdef SPECULARMAP
                vec4 specularColor = texture2D(m_SpecularMap, newTexCoord);
            #else
                vec4 specularColor = vec4(1.0);
            #endif
            #ifdef GLOSSINESSMAP
                float glossiness = texture2D(m_GlossinesMap, newTexCoord).r * m_Glossiness;
            #else
                float glossiness = m_Glossiness;
            #endif
            specularColor *= m_Specular;
        #endif
        vec4 diffuseColor = albedo;// * (1.0 - max(max(specularColor.r, specularColor.g), specularColor.b));
        Roughness = 1.0 - glossiness;
        vec3 fZero = specularColor.xyz;
    #else      
        float specular = 0.5;
        float nonMetalSpec = 0.08 * specular;
        vec4 specularColor = (nonMetalSpec - nonMetalSpec * Metallic) + albedo * Metallic;
        vec4 diffuseColor = albedo - albedo * Metallic;
        vec3 fZero = vec3(specular);
    #endif

    gl_FragColor.rgb = vec3(0.0);
    vec3 ao = vec3(1.0);
    
    #ifdef LIGHTMAP
       vec3 lightMapColor;
       #ifdef SEPARATE_TEXCOORD
          lightMapColor = texture2D(m_LightMap, texCoord2).rgb;
       #else
          lightMapColor = texture2D(m_LightMap, texCoord).rgb;
       #endif
       #ifdef AO_MAP
         lightMapColor.gb = lightMapColor.rr;
         ao = lightMapColor;
       #else
         gl_FragColor.rgb += diffuseColor.rgb * lightMapColor;
       #endif
       specularColor.rgb *= lightMapColor;
    #endif

    #if defined(AO_PACKED_IN_MR_MAP) && defined(USE_PACKED_MR)
       ao = aoRoughnessMetallicValue.rrr;
    #endif
    
     ao *= skeletalCrackAoMult;
    
    
  //finalLightingScale ACCOUNTS FOR SUN EXPOSURE FOR INDOOR AND SHADED AREAS OUT OF THE SUN'S FULL LIGHTING.
    float finalLightingScale = 1.0; 
    #ifdef INDOOR_SUN_LIGHT_INTENSITY
        indoorSunLightExposure = m_SunLightIntensity.x;
        brightestPointLight = 0.0;
    #endif
    
    
    finalLightingScale *= indoorSunLightExposure; 
     
    float ndotv = max( dot( normal, viewDir ),0.0);
    for( int i = 0;i < NB_LIGHTS; i+=3){
        vec4 lightColor = g_LightData[i];
        vec4 lightData1 = g_LightData[i+1];                
        vec4 lightDir;
        vec3 lightVec;            
        lightComputeDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);

        float fallOff = 1.0;
        #if __VERSION__ >= 110
            // allow use of control flow
        if(lightColor.w > 1.0){
        #endif
            fallOff =  computeSpotFalloff(g_LightData[i+2], lightVec);
        #if __VERSION__ >= 110
        }
        #endif
        //point light attenuation
        fallOff *= lightDir.w;

        lightDir.xyz = normalize(lightDir.xyz);            
        vec3 directDiffuse;
        vec3 directSpecular;
        
        float hdotv = PBR_ComputeDirectLight(normal, lightDir.xyz, viewDir,
                            lightColor.rgb, fZero, Roughness, ndotv,
                            directDiffuse,  directSpecular);

        vec3 directLighting = diffuseColor.rgb *directDiffuse + directSpecular;
            
     //   #if defined(USE_VERTEX_COLORS_AS_SUN_INTENSITY) || defined(STATIC_SUN_INTENSITY)
            
            if(fallOff == 1.0){
                directLighting.rgb *= indoorSunLightExposure;// ... *^. to scale down how intense just the sun is (ambient and direct light are 1.0 fallOff)
                
            }
            else{
                    brightestPointLight = max(fallOff, brightestPointLight);
          
           }
   //     #endif
        
        
        
        gl_FragColor.rgb += directLighting * fallOff;
        
     
    }
    
    
    float minVertLighting;
    #ifdef BRIGHTEN_INDOOR_SHADOWS
        minVertLighting = 0.0833; //brighten shadows so that caves which are naturally covered from the DL shadows are not way too dark compared to when shadows are off
    #else
        minVertLighting = 0.0533;
    
    #endif
    
    finalLightingScale = max(finalLightingScale, brightestPointLight);
    
    finalLightingScale = max(finalLightingScale, minVertLighting); //essentially just the vertColors.r (aka indoor liht exposure) multiplied by the time of day scale.
    
    //IMPORTANT NOTE: You used to multiply finalLightingScale by the indirectLighting value, and need to do that here still
    //no need for anymore time of day code (also remove probe color scale ) as thats in ambient light now.

    #if NB_PROBES >= 1
        vec3 color1 = vec3(0.0);
        vec3 color2 = vec3(0.0);
        vec3 color3 = vec3(0.0);
        float weight1 = 1.0;
        float weight2 = 0.0;
        float weight3 = 0.0;

        float ndf = renderProbe(viewDir, wPosition, normal, norm, Roughness, diffuseColor, specularColor, ndotv, ao, g_LightProbeData, g_ShCoeffs, g_PrefEnvMap, color1);
        #if NB_PROBES >= 2
            float ndf2 = renderProbe(viewDir, wPosition, normal, norm, Roughness, diffuseColor, specularColor, ndotv, ao, g_LightProbeData2, g_ShCoeffs2, g_PrefEnvMap2, color2);
        #endif
        #if NB_PROBES == 3
            float ndf3 = renderProbe(viewDir, wPosition, normal, norm, Roughness, diffuseColor, specularColor, ndotv, ao, g_LightProbeData3, g_ShCoeffs3, g_PrefEnvMap3, color3);
        #endif

        #if NB_PROBES >= 2
            float invNdf =  max(1.0 - ndf,0.0);
            float invNdf2 =  max(1.0 - ndf2,0.0);
            float sumNdf = ndf + ndf2;
            float sumInvNdf = invNdf + invNdf2;
            #if NB_PROBES == 3
                float invNdf3 = max(1.0 - ndf3,0.0);
                sumNdf += ndf3;
                sumInvNdf += invNdf3;
                weight3 =  ((1.0 - (ndf3 / sumNdf)) / (NB_PROBES - 1)) *  (invNdf3 / sumInvNdf);
            #endif

            weight1 = ((1.0 - (ndf / sumNdf)) / (NB_PROBES - 1)) *  (invNdf / sumInvNdf);
            weight2 = ((1.0 - (ndf2 / sumNdf)) / (NB_PROBES - 1)) *  (invNdf2 / sumInvNdf);

            float weightSum = weight1 + weight2 + weight3;

            weight1 /= weightSum;
            weight2 /= weightSum;
            weight3 /= weightSum;
        #endif

        #ifdef USE_AMBIENT_LIGHT
            color1.rgb *= g_AmbientLightColor.rgb;
            color2.rgb *= g_AmbientLightColor.rgb;
            color3.rgb *= g_AmbientLightColor.rgb;
        #endif

// multiply probes by the finalLightingScale, as determined by pixel's 
// sunlightExposure and adjusted for nearby point/spot lights
        color1.rgb *= finalLightingScale;
        color2.rgb *= finalLightingScale;
        color3.rgb *= finalLightingScale;
        
        
        gl_FragColor.rgb += color1 * clamp(weight1,0.0,1.0) + color2 * clamp(weight2,0.0,1.0) + color3 * clamp(weight3,0.0,1.0);

    #endif
    
    #if defined(EMISSIVE) || defined (EMISSIVEMAP)
        #ifdef EMISSIVEMAP
            vec4 emissive = texture2D(m_EmissiveMap, newTexCoord);
            emissive *= m_Emissive; //applies emissive color to the emissive map
        #else
            vec4 emissive = m_Emissive;
        #endif
        
        emissive = emissive * pow(emissive.a, m_EmissivePower) * m_EmissiveIntensity;
        
      
        #if  defined (AFFLICTIONTEXTURE)
            #if defined (AFFLICTIONEMISSIVE)
                vec4 afflictionEmissive = texture2D(m_AfflictionEmissiveMap, newTexCoord);
                afflictionEmissive = afflictionEmissive * pow(afflictionEmissive.a, m_AfflictionEmissivePower) * m_AfflictionEmissivePower;
                
                emissive = mix(emissive, afflictionEmissive, m_AfflictionPercent);
            #else 
                #ifdef AFFLICTIONEMISSIVECOLOR
                    vec4 afflictionEmissive = m_AfflictionEmissiveColor * pow(m_AfflictionEmissiveColor.a, m_AfflictionEmissivePower) * m_AfflictionEmissivePower;                
                     emissive = mix(emissive, afflictionEmissive, m_AfflictionPercent);
                 #endif
            #endif
        #endif
        
       
        
        gl_FragColor.rgb += emissive.rgb;
    #endif
    

        #if !defined(IS_SKELETAL)

             #ifdef DISSOLVE

             if(alpha <= 0.001){
                         discard;
             }
             else{

                 //    vec4 dissolveColor = m_DissolveColor;
                     float dissolveAlpha = 1 - m_DissolveValue;


                 //    dissolveAlpha *= dissolveAlpha;

                     float rVal = 0.27 + (0.69 * dissolveAlpha);



                     vec3 dissolveColor = vec3(rVal, 0.0, 0.69);

                     //IMPORTANT ! ! : change mPosition to a custom varying that accounts for scale? or also maybe add a scale factor so you can make different enemies dissolve into smaller/larger bits as 
                     float noiseVal = Noise3D(scaledModelPos, 0.093) + 0.00001 ;


                     dissolveColor *= ((0.7 * dissolveAlpha) + (noiseVal * 0.3));
                     dissolveAlpha *= noiseVal * 10;

                     dissolveAlpha = min(1.0, dissolveAlpha);

                     gl_FragColor.rgb = mix(gl_FragColor.rgb, dissolveColor, m_DissolveValue);
                 //    gl_FragColor.rgb = vec3(0.5, 0.5, 0.49);
                     alpha = dissolveAlpha;




             }

             #endif
         #endif

         
        gl_FragColor.rgb *= skeletalCrackAoMult;

  
  
      // add fog after the lighting because shadows will cause the fog to darken
    // which just results in the geometry looking like it's changed color
    #ifdef USE_FOG
        #ifdef FOG_LINEAR
            gl_FragColor = getFogLinear(gl_FragColor, m_FogColor, m_LinearFog.x, m_LinearFog.y, fogDistance);
        #endif
        #ifdef FOG_EXP
            gl_FragColor = getFogExp(gl_FragColor, m_FogColor, m_ExpFog, fogDistance);
        #endif
        #ifdef FOG_EXPSQ
            gl_FragColor = getFogExpSquare(gl_FragColor, m_FogColor, m_ExpSqFog, fogDistance);
        #endif
        
    #endif 
    
    
    gl_FragColor.a = alpha;

}