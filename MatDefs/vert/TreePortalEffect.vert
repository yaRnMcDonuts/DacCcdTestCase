#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Instancing.glsllib"
#import "Common/ShaderLib/Skinning.glsllib"
#import "Common/ShaderLib/MorphAnim.glsllib"
#import "MatDefs/ShaderLib/NoiseLib.glsllib"

uniform vec4 m_BaseColor;

uniform vec4 g_AmbientLightColor;
varying vec2 texCoord;

#ifdef SEPARATE_TEXCOORD
  varying vec2 texCoord2;
  attribute vec2 inTexCoord2;
#endif

varying vec4 Color;

attribute vec3 inPosition;
attribute vec2 inTexCoord;
attribute vec3 inNormal;

#if defined (VERTEX_COLOR) || defined(USE_VERTEX_COLORS_AS_SUN_INTENSITY)
    attribute vec4 inColor;
#endif

#if defined(USE_VERTEX_COLORS_AS_SUN_INTENSITY)
    varying vec4 vertColors;
#endif

varying vec3 wNormal;
varying vec3 wPosition;

varying vec3 mPos;

//#if defined(NORMALMAP) || defined(PARALLAXMAP)
    attribute vec4 inTangent;
    varying vec4 wTangent;
//#endif

uniform float g_Time;


#ifdef EFFECTUVMAP
    uniform sampler2D m_EffectUvMap;
#endif

#ifdef USE_FOG
    varying float fogDistance;
    uniform vec3 g_CameraPosition;
#endif


void main(){
    #ifdef USE_VERTEX_COLORS_AS_SUN_INTENSITY
        vertColors = inColor;
    #endif
    
    
    vec4 modelSpacePos = vec4(inPosition, 1.0);
    vec3 modelSpaceNorm = inNormal;

  //  #if  (defined(NORMALMAP) || defined(PARALLAXMAP)) && !defined(VERTEX_LIGHTING)
         vec3 modelSpaceTan  = inTangent.xyz;
  //  #endif
    
    #ifdef NUM_MORPH_TARGETS
         #if defined(NORMALMAP) && !defined(VERTEX_LIGHTING)
            Morph_Compute(modelSpacePos, modelSpaceNorm, modelSpaceTan);
         #else
            Morph_Compute(modelSpacePos, modelSpaceNorm);
         #endif
    #endif

    #ifdef NUM_BONES
         #if defined(NORMALMAP) && !defined(VERTEX_LIGHTING)
         Skinning_Compute(modelSpacePos, modelSpaceNorm, modelSpaceTan);
         #else
         Skinning_Compute(modelSpacePos, modelSpaceNorm);
         #endif
    #endif



    #ifdef EFFECTUVMAP
        vec4 splatColor = texture2D(m_EffectUvMap, inTexCoord);
        vec2 coords0 = vec2(modelSpacePos.z *2.0 + g_Time, modelSpacePos.y *2.0 + g_Time);
        vec3 coords = vec3(coords0, modelSpacePos.x *2.0 + g_Time);

        if(splatColor.r > .92 ){
            
                
       //       modelSpacePos += vec4(inNormal, 1) *(((.08 - (.1* (Noise3D(coords, 5.0))))*2.85));
              modelSpacePos.y += ((.08 - (.1* (Noise3D(coords, 1.33))))*2.9);
            
        }
        else{
        if(splatColor.g > .98 && splatColor.r < .4){
                modelSpacePos.x +=  (((.08 - (.1* (Noise3D(coords, .9))))*2.85));
            }
        }
        

    #endif
    
 gl_Position = TransformWorldViewProjection(modelSpacePos);
    texCoord = inTexCoord;
    #ifdef SEPARATE_TEXCOORD
       texCoord2 = inTexCoord2;
    #endif

    wPosition = (g_WorldMatrix * vec4(inPosition, 1.0)).xyz;
    wNormal  = TransformWorldNormal(modelSpaceNorm);

 //   #if defined(NORMALMAP) || defined(PARALLAXMAP)
      wTangent = vec4(TransformWorldNormal(modelSpaceTan),inTangent.w);
 //   #endif

    Color = m_BaseColor;
    
    #ifdef VERTEX_COLOR                
        Color *= inColor;
    #endif
    
     #ifdef USE_FOG
        fogDistance = distance(g_CameraPosition, (g_WorldMatrix * modelSpacePos).xyz);
    #endif
}