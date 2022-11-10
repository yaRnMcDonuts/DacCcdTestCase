#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/PBR.glsllib"
#import "Common/ShaderLib/Parallax.glsllib"
#import "Common/ShaderLib/Lighting.glsllib"
#import "MatDefs/ShaderLib/AfflictionLib.glsllib"
#import "MatDefs/ShaderLib/NoiseLib.glsllib"
#import "MatDefs/ShaderLib/WaterLib.glsllib"



#ifdef AFFLICTIONTEXTURE
    uniform sampler2D m_AfflictionAlphaMap;
#endif

uniform int m_AfflictionSplatScale;
#ifdef AFFLICTIONALBEDOMAP
    uniform sampler2D m_SplatAlbedoMap;
#endif

#ifdef AFFLICTIONNORMALMAP
    uniform sampler2D m_SplatNormalMap;
#endif

#ifdef AFFLICTIONROUGHNESSMETALLICMAP
    uniform sampler2D m_SplatRoughnessMetallicMap;
#endif

#ifdef AFFLICTIONEMISSIVEMAP
    uniform sampler2D m_SplatEmissiveMap;
#endif

uniform float m_AfflictionRoughnessValue;
uniform float m_AfflictionMetallicValue;
uniform float m_AfflictionEmissiveValue;
uniform vec4 m_AfflictionEmissiveColor;

#ifdef TILEWIDTH
    uniform float m_TileWidth;
#endif

#ifdef TILELOCATION
    uniform vec3 m_TileLocation;
#endif

#ifdef USE_FOG
#import "MatDefs/ShaderLib/MaterialFog.glsllib"
    uniform vec4 m_FogColor;
    varying float fogDistance;

    uniform vec2 m_LinearFog;
#endif

#ifdef FOG_EXP
uniform float m_ExpFog;
#endif

#ifdef FOG_EXPSQ
uniform float m_ExpSqFog;
#endif

uniform float g_Time;
uniform float m_Liveliness;

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

#ifdef EFFECTMAP
    uniform sampler2D m_EffectMap;
#endif

#ifdef EFFECTUVMAP
    uniform sampler2D m_EffectUvMap;
#endif



float brightestPointLight = 1.0;
 // after scaling down based on indoor vert colors and the actual time of day, scale BACK UP for anything near a point light (as an indoor light should increase illumination from lightprobe brighter)
  

#if defined(USE_VERTEX_COLORS_AS_SUN_INTENSITY)
    varying vec4 vertColors;
#endif

#ifdef STATIC_SUN_INTENSITY
    uniform float m_StaticSunIntensity;
#endif



varying vec3 mPos;

vec3 blending;



void main(){
    
    float indoorSunLightExposure = 1.0;//scale this to match R channel of vertex colors
                  


    //init blending variable incase affliction map needs splatted on vertical walls, hence the need for triplanar mapping 
    #ifdef USE_TRIPLANAR_AFFLICTION_MAPPING
        blending = abs( wNormal );
                blending = (blending -0.2) * 0.7;
                blending = normalize(max(blending, 0.00001));      // Force weights to sum to 1.0 (very important!)
                float b = (blending.x + blending.y + blending.z);
                blending /= vec3(b, b, b);
    #endif
    
    vec2 newTexCoord;
    vec3 viewDir = normalize(g_CameraPosition - wPosition);

    float speed = 10;

    vec2 timeCoordVec = vec2(wPosition.x + (g_Time * speed * 1.36), wPosition.z + (g_Time * speed));

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
//    newTexCoord = vec2(wPosition.x, wPosition.z);
//    newTexCoord *=0.022;



    newTexCoord *= 6;
    newTexCoord.x += g_Time * (speed/8);
    newTexCoord.y += .05*( 0.5 -  ( pnoise(wPosition.xy, 200))* (pnoise(timeCoordVec, 1.5)));
    newTexCoord = mod(newTexCoord, 1);
    
    #ifdef BASECOLORMAP
        vec4 albedo = texture2D(m_BaseColorMap, newTexCoord) * Color;
    #else
        vec4 albedo = Color;
    #endif
    
    

 //   albedo = vec4(0.0,0.2,0.8,0.5) * (albedo.r + 0.08);

    //ALTER LIVELINESS OF WATERFALL
        float heightColorVar = (texCoord.x/ 1.05);  // +0.05;
        albedo.b += (heightColorVar * 0.35) ;
    //    albedo.g *= heightColorVar + 0.1;
    
    
     vec4 afflictionVector = vec4(1.0, 0.0, 0.0, 0.0);

    #if defined(AFFLICTIONTEXTURE) && defined(TILEWIDTH) && defined(TILELOCATION)
        vec2 tileCoords;
        float xPos, zPos;

        vec3 locInTile = (wPosition - m_TileLocation);

         locInTile += vec3(m_TileWidth/2, 0, m_TileWidth/2);

         xPos = (locInTile.x / m_TileWidth);
         zPos = 1 - (locInTile.z / m_TileWidth);
        
        tileCoords = vec2(xPos, zPos);

        afflictionVector = texture2D(m_AfflictionAlphaMap, tileCoords).rgba;

    #endif

    float livelinessValue = afflictionVector.r;
    float afflictionValue = afflictionVector.g;
//    float afflictionValue = afflictionVector.g; // idea maybe? 
//    float windValue = afflictionVector.b; // idea maybe? 


  
    float deathVar = (1.0 - (livelinessValue));

        albedo = alterWaterLiveliness(albedo, m_Liveliness);


     
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
 
    float alpha = (noise(timeCoordVec) * 0.05) + 0.95;





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
    
       //APPLY AFFLICTIONNESS TO THE PIXEL

    float noiseHash = getStaticNoiseVar0(wPosition, afflictionValue);

    vec4 afflictionAlbedo;    
    vec2 newScaledCoords;
    float newAfflictionScale = m_AfflictionSplatScale;

    #ifdef AFFLICTIONALBEDOMAP
         #ifdef USE_TRIPLANAR_AFFLICTION_MAPPING

            newAfflictionScale = newAfflictionScale / 256;
            afflictionAlbedo = getTriPlanarBlend(vec4(wPosition, 1.0), blending, m_SplatAlbedoMap , newAfflictionScale);

         #else
            newScaledCoords = mod(wPosition.xz / m_AfflictionSplatScale, 1);
            afflictionAlbedo = texture2D(m_SplatAlbedoMap , newScaledCoords);
         #endif
        
        
    #else
        afflictionAlbedo = vec4(0.55, 0.8, 0.00, 1.0);
    #endif

    vec3 afflictionNormal;
    #ifdef AFFLICTIONNORMALMAP
        #ifdef USE_TRIPLANAR_AFFLICTION_MAPPING
            afflictionNormal = getTriPlanarBlend(vec4(wPosition, 1.0), blending, m_SplatNormalMap , newAfflictionScale).rgb;
        #else
           afflictionNormal = texture2D(m_SplatNormalMap , newScaledCoords).rgb;
        #endif
        
        afflictionNormal = normalize((afflictionNormal.xyz * vec3(2.0, NORMAL_TYPE * 2.0, 2.0) - vec3(1.0, NORMAL_TYPE * 1.0, 1.0)));

         
    #else
        afflictionNormal = norm; 

    #endif

    


    #ifdef NORMALMAP
        afflictionNormal = normalize(afflictionNormal *  inverse(tbnMat));
        normal = alterAfflictionNormals(afflictionValue, normal, afflictionNormal, noiseHash);
    #else
        afflictionNormal *= afflictionValue;
        normal = normalize(norm + afflictionNormal);
    #endif

    float afflictionMetallic = m_AfflictionMetallicValue;
    float afflictionRoughness = m_AfflictionRoughnessValue;
    float afflictionAo = 1.0;


    vec4 afflictionEmissive = m_AfflictionEmissiveColor;
    float afflictionEmissiveIntensity = m_AfflictionEmissiveValue;


    #ifdef AFFLICTIONROUGHNESSMETALLICMAP    
        vec4 metallicRoughnessAoEiVec = texture2D(m_SplatRoughnessMetallicMap, newScaledCoords);
        afflictionRoughness *= metallicRoughnessAoEiVec.g;
        afflictionMetallic *= metallicRoughnessAoEiVec.b;
        afflictionAo = metallicRoughnessAoEiVec.r;
        afflictionEmissiveIntensity *= metallicRoughnessAoEiVec.a; //important not to leave this channel all black by accident in the mraoei map if using affliction emissiveness    

    #endif

    #ifdef AFFLICTIONEMISSIVEMAP
        vec4 emissiveMapColor = texture2D(m_SplatEmissiveMap, newScaledCoords);
        afflictionEmissive *= emissiveMapColor;
    #endif



    noiseHash = getStaticNoiseVar0(wPosition, afflictionValue);
    Roughness = alterAfflictionRoughness(afflictionValue, Roughness, afflictionRoughness, noiseHash);
    Metallic = alterAfflictionMetallic(afflictionValue, Metallic,  afflictionMetallic, noiseHash);
    albedo = alterAfflictionColor(afflictionValue, albedo, afflictionAlbedo, noiseHash );
    normal = alterAfflictionNormals(afflictionValue, normal, afflictionNormal, noiseHash);
    
//    emissive = alterAfflictionGlow(afflictionValue, emissive, afflictionEmissive, noiseHash);    
 //   emissiveIntensity = alterAfflictionEmissiveIntensity(afflictionValue, emissiveIntensity, afflictionEmissiveIntensity, noiseHash);
 //   emissiveIntensity *= afflictionEmissive.a;
    //affliction ao value blended below after specular calculation

    
    
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

    ao = alterAfflictionAo(afflictionValue, ao, vec3(afflictionAo), noiseHash); // alter the AO map for affliction values
    
    
  //finalLightingScale ACCOUNTS FOR SUN EXPOSURE FOR INDOOR AND SHADED AREAS OUT OF THE SUN'S FULL LIGHTING.
    float finalLightingScale = 1.0; 
    #ifdef STATIC_SUN_INTENSITY
        indoorSunLightExposure = m_StaticSunIntensity; //single float value to indicate percentage of
                           //sunlight hitting the model (only works for small models or models with 100% consistent sunlighting)
    #endif
    #ifdef USE_VERTEX_COLORS_AS_SUN_INTENSITY
        indoorSunLightExposure = vertColors.r * indoorSunLightExposure;      //use R channel of vertexColors for..       
    #endif 
                                                               // similar purpose as above... *^.  
                                                             //but uses r channel vert colors like an AO map specifically
                                                                 //for sunlight (solution for scaling lighting for indoor
                                                                  // and shadey/dimly lit models, especially big ones)
    brightestPointLight = 0.0;
    
    
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
        #else
            vec4 emissive = m_Emissive;
           
        #endif

        gl_FragColor += emissive * pow(emissive.a, m_EmissivePower) * m_EmissiveIntensity;
    #endif




  gl_FragColor.a = alpha;


}