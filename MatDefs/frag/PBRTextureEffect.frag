#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/PBR.glsllib"
#import "Common/ShaderLib/Parallax.glsllib"
#import "Common/ShaderLib/Lighting.glsllib"


#ifdef TRIPLANAR
    vec4 getTriPlanarBlend(in vec4 coords, in vec3 blending, in sampler2D map, in float scale) {
      vec4 col1 = texture2D( map, coords.yz * scale);
      vec4 col2 = texture2D( map, coords.xz * scale);
      vec4 col3 = texture2D( map, coords.xy * scale); 
      // blend the results of the 3 planar projections.
      vec4 tex = col1 * blending.x + col2 * blending.y + col3 * blending.z;
      
      return tex;
    }
#endif

float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}


float prand(vec2 c){
	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float pnoise(vec2 p, float freqPct){
	//float unit = circ/freq;
        float unit = freqPct;

	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(3.14159*xy));
	float a = prand((ij+vec2(0.,0.)));
	float b = prand((ij+vec2(1.,0.)));
	float c = prand((ij+vec2(0.,1.)));
	float d = prand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}



// - - - - - - - - 

float rand3D(in vec3 co){
    return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,144.7272))) * 43758.5453);
}
    
float simple_interpolate(in float a, in float b, in float x)
{
   return a + smoothstep(0.0,1.0,x) * (b-a);
}
float interpolatedNoise3D(in float x, in float y, in float z)
{
    float integer_x = x - fract(x);
    float fractional_x = x - integer_x;

    float integer_y = y - fract(y);
    float fractional_y = y - integer_y;

    float integer_z = z - fract(z);
    float fractional_z = z - integer_z;

    float v1 = rand3D(vec3(integer_x, integer_y, integer_z));
    float v2 = rand3D(vec3(integer_x+1.0, integer_y, integer_z));
    float v3 = rand3D(vec3(integer_x, integer_y+1.0, integer_z));
    float v4 = rand3D(vec3(integer_x+1.0, integer_y +1.0, integer_z));

    float v5 = rand3D(vec3(integer_x, integer_y, integer_z+1.0));
    float v6 = rand3D(vec3(integer_x+1.0, integer_y, integer_z+1.0));
    float v7 = rand3D(vec3(integer_x, integer_y+1.0, integer_z+1.0));
    float v8 = rand3D(vec3(integer_x+1.0, integer_y +1.0, integer_z+1.0));

    float i1 = simple_interpolate(v1,v5, fractional_z);
    float i2 = simple_interpolate(v2,v6, fractional_z);
    float i3 = simple_interpolate(v3,v7, fractional_z);
    float i4 = simple_interpolate(v4,v8, fractional_z);

    float ii1 = simple_interpolate(i1,i2,fractional_x);
    float ii2 = simple_interpolate(i3,i4,fractional_x);

    return simple_interpolate(ii1 , ii2 , fractional_y);
}

float Noise3D(in vec3 coord, in float wavelength)
{
   return interpolatedNoise3D(coord.x/wavelength, coord.y/wavelength, coord.z/wavelength);
}




    uniform vec3 m_Noise;
    
    uniform vec4 m_DecalDataVec;
    
    uniform float m_Radius;


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
varying vec4 worldCoords;




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

    uniform vec4 m_BaseColor;

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
  varying vec4 wTangent;
#endif
varying vec3 wNormal;

#ifdef DISCARD_ALPHA
uniform float m_AlphaDiscardThreshold;
#endif

uniform vec3 m_CenterPoint;
uniform vec3 m_ProjectorDimensions;

uniform float m_EdgeFadeDistance;

uniform bool m_CircleShape;

varying vec3 mPos;
varying vec3 mNorm;

float brightestPointLight = 1.0;

#if defined(USE_VERTEX_COLORS_AS_SUN_INTENSITY)
    varying vec4 vertColors;
#endif

#ifdef STATIC_SUN_INTENSITY
    uniform float m_StaticSunIntensity;
#endif

#ifdef PROBE_COLOR
    uniform vec4 m_ProbeColor;
#endif

void main(){
    
    
    float indoorSunLightExposure = 1.0;//scale this to match R channel of vertex colors

    vec3 probeColorMult = vec3(1.0);
    float timeOfDayScale = 1.0;
    #ifdef PROBE_COLOR
            timeOfDayScale = m_ProbeColor.w; // time of day is stored in alpha value of the ProbeColor vec4. this way the rgb vec3 can be used for scaling probe color
            probeColorMult = m_ProbeColor.xyz;
     #endif
    
    vec3 blending;
    vec3 norm = normalize(wNormal);

    #ifdef TRIPLANAR
        blending = abs( wNormal );
        blending = (blending -0.2) * 0.7;
        blending = normalize(max(blending, 0.00001));      // Force weights to sum to 1.0 (very important!)
        float b = (blending.x + blending.y + blending.z);
        blending /= vec3(b, b, b);
    #endif
    
  //modify tex coords if this decal / effect has a different scale


    float scale =   m_DecalDataVec.x;


    
    vec2 scaledTexCoord = texCoord;
    
    
    //this wont be needed (and will not be wanted) for moving effects like iceStorm (as you don't want the snow texture sliding accross ground) but will be likely useful for debug things
    //and things like the targetSelectionCircle  -- could also scrap this and make a special debugCircle mode that uses dist from centerPoint to make circle as well, especially if these seems to have no more use cases...
  //  #ifdef KEEP_TEXTURE_CENTERED_TO_CENTER_LOC

        //attempt so far to make it so that an effect like the targetCircle can have a centerLoc offset from the center of the full radius. but only works when visRadius is exactly 70% of fullRadius as of now for some reason...
        if(scale < 1.0){

            float inverseScale = 1 - scale;

            float halfInverse = 0.5 * inverseScale;


            scaledTexCoord = scaledTexCoord * scale;


            scaledTexCoord = scaledTexCoord - (halfInverse);


            scaledTexCoord.x += (0.265 * (scaledTexCoord.x -1 ) );
             scaledTexCoord.y += (0.265 * (scaledTexCoord.y -1 ) );

             scaledTexCoord.y += 0.5;
             scaledTexCoord.x += 0.5;

      //        scaledTexCoord += 0.25f;
       //     scaledTexCoord += 0.25f;

       //      scaledTexCoord.x += halfInverse * (0.5 * (1 - scaledTexCoord.x));
        //     scaledTexCoord.y += halfInverse * (0.5* (1 - scaledTexCoord.y));
        }else{
            scaledTexCoord = scaledTexCoord * scale;
        }
//     #endif   
  
    
    float visibleRadius = m_DecalDataVec.z;
    
    
    //attempt at moving the tex coords to account for a scaling down (would be useful for when the visible radius is less than the full radius, and you don't want the max and min uv coord values to be in the area
        //byeond the visible radius but still within the full (and partially discarded) radius

        float texX = scaledTexCoord.x;
       float texZ = scaledTexCoord.y;

       texX = mod(texX, 1);
       texZ = mod(texZ, 1);

       scaledTexCoord = vec2(texX, texZ);
        
        
        




    vec2 newTexCoord;
    vec3 viewDir = normalize(g_CameraPosition - wPosition);

    
    #if defined(NORMALMAP) || defined(PARALLAXMAP)
        vec3 tan = normalize(wTangent.xyz);
        mat3 tbnMat = mat3(tan, wTangent.w * cross( (norm), (tan)), norm);
    #endif

    #if (defined(PARALLAXMAP) || (defined(NORMALMAP_PARALLAX) && defined(NORMALMAP)))
       vec3 vViewDir =  viewDir * tbnMat;  
       #ifdef STEEP_PARALLAX
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = steepParallaxOffset(m_NormalMap, vViewDir, scaledTexCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = steepParallaxOffset(m_ParallaxMap, vViewDir, scaledTexCoord, m_ParallaxHeight);         
           #endif
       #else
           #ifdef NORMALMAP_PARALLAX
               //parallax map is stored in the alpha channel of the normal map         
               newTexCoord = classicParallaxOffset(m_NormalMap, vViewDir, scaledTexCoord, m_ParallaxHeight);
           #else
               //parallax map is a texture
               newTexCoord = classicParallaxOffset(m_ParallaxMap, vViewDir, scaledTexCoord, m_ParallaxHeight);
           #endif
       #endif
    #else
       newTexCoord = scaledTexCoord;    
    #endif
    
   



    #ifdef BASECOLORMAP

         #ifdef TRIPLANAR
            float triScale = m_DecalDataVec.x / 256;
            vec4 albedo = getTriPlanarBlend(worldCoords, blending, m_BaseColorMap, triScale) * Color;

         #else
            vec4 albedo = texture2D(m_BaseColorMap, newTexCoord) * Color;
         #endif
        
        


    #else
        vec4 albedo = Color;
    #endif
    
    albedo *= m_BaseColor;
    
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
 
    float alpha = albedo.a;

    #ifdef DISCARD_ALPHA
        if(alpha < m_AlphaDiscardThreshold){
            discard;
        }
        
    #endif

 
    // ***********************
    // Read from textures
    // ***********************
    #if defined(NORMALMAP)
        #ifdef TRIPLANAR
          vec4 normalHeight = getTriPlanarBlend(vec4(wPosition, 1.0), blending, m_NormalMap, triScale);
        #else
         vec4 normalHeight = texture2D(m_NormalMap, newTexCoord);

        #endif
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

// ____________________ \/ TEXTURE EFFECTS \/

    float perlinNoise = 0; 
    float standardNoise = 0;
    float totalNoise = 0;
//    #ifdef USENOISE
    if(m_Noise.x > 0){
        standardNoise = interpolatedNoise3D(wPosition.x, wPosition.y, wPosition.z) * m_Noise.x;
    }
    if(m_Noise.y > 0 || m_Noise.z > 0){
       perlinNoise = Noise3D(wPosition.xyz, m_Noise.y) * m_Noise.z;
    }
        
 //       float weightTotal = m_Noise.x + m_Noise.z;
        totalNoise = (perlinNoise + standardNoise) * .5;// (perlinNoise *(m_Noise.z / weightTotal)) + (standardNoise *(m_Noise.x / weightTotal)) * .5;
//    #endif

    
    #ifdef USECIRCLESHAPE
        float fragDist = distance(wPosition, m_CenterPoint);
        float originalFragDist = fragDist;
        fragDist += totalNoise;
     //   float radius = m_ProjectorDimensions.x; ;

        float radius = visibleRadius ;
        
        if(scale < 1){
             fragDist *= scale;
            }
            
       
//        #else
//            radius = m_ProjectorDimensions.x; 


        float edgeFadeValue = m_DecalDataVec.y;

        float edgeFadeLimit = radius - edgeFadeValue;

         if(fragDist > radius){
            discard;
        }
        
        else if(fragDist > edgeFadeLimit){
      //      float slerp = max( m_EdgeFadeDistance /edgeFadeLimit, 0 );
     //       alpha = mix(alpha, 0.0, slerp);
            alpha *= pow(((radius - fragDist) / m_EdgeFadeDistance), 2);

         }
        

        if(alpha <= 0 ){
             discard;
        }
        else{
            alpha = min(alpha, 1.0);
        }
    #else
// 'crop' the square here using transparency, until you do so in the mesh creation
          vec3 dist = (wPosition - m_CenterPoint);
          if(dist.x < 0){
            dist.x *= -1;
          }
          if(dist.z < 0 ){
            dist.z *= -1;
          }
         if(dist.y < 0 ){
            dist.y *= -1;
          }
          
          dist.z += totalNoise;
          dist.x += totalNoise;


          float edgeFadeLimitX = m_ProjectorDimensions.x - m_EdgeFadeDistance;
          float edgeFadeLimitZ = m_ProjectorDimensions.z - m_EdgeFadeDistance;
          float edgeFadeLimitY = m_ProjectorDimensions.y - m_EdgeFadeDistance;

          if(dist.x > m_ProjectorDimensions.x || dist.z > m_ProjectorDimensions.z || dist.y > m_ProjectorDimensions.y){
            discard;
          }
          else{
            if(dist.x > edgeFadeLimitX){
                alpha *= (m_ProjectorDimensions.x - dist.x) / m_EdgeFadeDistance;
            }
            if(dist.z > edgeFadeLimitZ){
                alpha *= (m_ProjectorDimensions.z - dist.z) / m_EdgeFadeDistance;
            }
            if(dist.y > edgeFadeLimitY){
                alpha *= (m_ProjectorDimensions.y - dist.y) / m_EdgeFadeDistance;
            }
          }

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