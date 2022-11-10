#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Instancing.glsllib"
#import "Common/ShaderLib/Skinning.glsllib"

#import "MatDefs/ShaderLib/AfflictionLib.glsllib"


#if defined(SKELETAL_RATTLE_VALUE) && defined(SKELETAL_RATTLE_MAP) && defined(NOISEMAP)
    uniform vec2 m_SkeletalRattleValue;
    uniform sampler2D m_SkeletalRattleMap;
    uniform sampler2D m_NoiseMap;
#endif


uniform vec4 m_BaseColor;
uniform float g_Time;


uniform float m_Liveliness;

uniform vec4 g_AmbientLightColor;
varying vec2 texCoord;


varying vec3 scaledModelPos;

#ifdef SEPARATE_TEXCOORD
  varying vec2 texCoord2;
  attribute vec2 inTexCoord2;
#endif

varying vec4 Color;

attribute vec3 inPosition;
attribute vec2 inTexCoord;
attribute vec3 inNormal;

#ifdef VERTEX_COLOR
  attribute vec4 inColor;
#endif

varying vec3 wNormal;
varying vec3 wPosition;
varying vec3 mPosition; 

//#if defined(NORMALMAP) || defined(PARALLAXMAP)
    attribute vec4 inTangent;
    varying vec4 wTangent;
//#endif

#ifdef METALLICMAP
     uniform sampler2D m_MetallicMap;
#endif

uniform float m_DissolveValue;

void main(){

    vec4 modelSpacePos = vec4(inPosition, 1.0);
    vec3 modelSpaceNorm = inNormal;
    
    
    
    mPosition = modelSpacePos.xyz;
    
    
    
    float xTot, zTot, yTot;
    
    xTot = length(g_WorldMatrix[0]);
    yTot = length(g_WorldMatrix[1]);
    zTot = length(g_WorldMatrix[2]);
    
    vec3 scaleVec = vec3(xTot,yTot,zTot);
      
//    #if  ( defined(NORMALMAP) || defined(PARALLAXMAP)) && !defined(VERTEX_LIGHTING)
         vec3 modelSpaceTan  = inTangent.xyz;
//    #endif

    #ifdef NUM_BONES
         #if defined(NORMALMAP) && !defined(VERTEX_LIGHTING)
         Skinning_Compute(modelSpacePos, modelSpaceNorm, modelSpaceTan);
         #else
         Skinning_Compute(modelSpacePos, modelSpaceNorm);
         #endif
    #endif


 #if defined(DISSOLVE) && !defined(IS_SKELETAL) 
    float moveVar = 1 - m_DissolveValue;
    float noiseVar =  pnoise(texCoord + vec2(g_Time), 1.5); 
    noiseVar = (-0.5 + noiseVar) * (0.33 + moveVar);
     
    vec3 modelNormal = modelSpaceNorm * noiseVar;
    modelSpacePos.xyz += modelNormal;
#endif


     wPosition = (g_WorldMatrix * modelSpacePos).xyz;
   
     scaledModelPos = inPosition.xyz * scaleVec.xyz;
   
 
    gl_Position = TransformWorldViewProjection(modelSpacePos);
 
   
 

 //alter the bones in world space when they are rattling, so you can accurately represent each world unit consistently

#if defined(IS_SKELETAL) && defined(SKELETAL_RATTLE_VALUE) && defined(NOISEMAP)
    
 
    vec4 rattleMapVec = texture2D(m_SkeletalRattleMap, texCoord).rgba;
 
        float seedVal = 0; //alter this value based on the value of r/g/b channels
       
       if(rattleMapVec.r >= 0.9){
           seedVal = 0.01f;
        }
        else if(rattleMapVec.g >= 0.9){
           seedVal = 0.21f;
        }
        else if(rattleMapVec.b >= 0.9){
           seedVal = 0.84f;
           
           
        }
        else{
           seedVal = 0.89f;
        }
          
          
          seedVal+= (scaledModelPos.x * 0.1);
          
  //     seedVal = m_SkeletalRattleValue;
    float skeletalRattleValueFloat = m_SkeletalRattleValue.x;
       
       vec3 positionVariationVector; //  
       
       
        float zNoiseVal; // =  pnoise(vec2(seedVal, seedVal*0.835) , 0.11525f); //very low frequency so the bones dont rattle too smoothly
       float xNoiseVal; // =     pnoise(vec2(seedVal *  -1.03, seedVal * 1.44), 0.115246f );
       
       
       
       vec2 noiseCoord = vec2(seedVal, seedVal + (skeletalRattleValueFloat + 1.75) *skeletalRattleValueFloat);
       vec3 noiseVec = texture2D(m_NoiseMap, noiseCoord).rgb;
       
       xNoiseVal = noiseVec.x;
       zNoiseVal = noiseVec.y;
       float yNoiseVal = noiseVec.z;
       
       
       float yVal = (skeletalRattleValueFloat * 1.5) + (zNoiseVal * (skeletalRattleValueFloat * 0.3f)); //y will mostly always go up as rattleValue increases, so just combine x and z noise are used as an additional noise var 
      yVal *= (1 + yNoiseVal * 1.95);
       
       
       
       //allow x and z to go into negatives, by doubling its value (so its range is 0 to 2) and then subtract 1 (so the final range of each x/z noise value will be -1 to 1 )
       
       vec2 xzVec = vec2(xNoiseVal, zNoiseVal);
       xzVec *= 4;
       
       xzVec -= vec2(1);
       

       xzVec *= 0.25;
       
    if(skeletalRattleValueFloat > 0){   //this float will be accumulated, and then decreased in the java code for the Agent class, for a short duration of time after the bones are struck.
      
        
    }
    
    if(skeletalRattleValueFloat >= 1){ // the bones will never rattle past 1, unless the corpse has been compleyely destroyed. then the rattle value goes above 1 and the bones fly higher 
        
        
  //       skeletalRattleValueFloat = 1 + (skeletalRattleValueFloat * 0.1);
      float amtPastOne = skeletalRattleValueFloat - 1;
      xzVec.y += (amtPastOne * 0.9); //this makes the bones fly higher 
            
           
   }
   
   
    positionVariationVector = vec3(xzVec.x, xzVec.y, -yVal) * (skeletalRattleValueFloat * 3);
     
   
   
   gl_Position += vec4(positionVariationVector , 0);

#endif


   


#if !defined(IS_SKELETAL)
    #ifdef DISSOLVE
        //gl_Position *=  0.5 + ( 0.5 * scaleVar);
        gl_Position.y += m_DissolveValue  * m_DissolveValue * 1.1;
    #endif
#endif
    


//    gl_Position = TransformWorldViewProjection(modelSpacePos);
    texCoord = inTexCoord;
    #ifdef SEPARATE_TEXCOORD
       texCoord2 = inTexCoord2;
    #endif

   
    wNormal  = TransformWorldNormal(modelSpaceNorm);

//    #if defined(NORMALMAP) || defined(PARALLAXMAP)
      wTangent = vec4(TransformWorldNormal(modelSpaceTan),inTangent.w);
//    #endif

    Color = m_BaseColor;
    
    #ifdef VERTEX_COLOR                    
        Color *= inColor;
    #endif
}