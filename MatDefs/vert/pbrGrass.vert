#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Instancing.glsllib"
#import "Common/ShaderLib/Skinning.glsllib"


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

uniform vec4 m_BaseColor;
uniform float g_Time;

uniform float m_Liveliness;

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

#ifdef VERTEX_COLOR
  attribute vec4 inColor;
#endif

varying vec3 wNormal;
varying vec3 wPosition;
//#if defined(NORMALMAP) || defined(PARALLAXMAP)
    attribute vec4 inTangent;
    varying vec4 wTangent;
//#endif

#ifdef METALLICMAP
     uniform sampler2D m_MetallicMap;
#endif

#ifdef USE_FOG
    varying float fogDistance;
    uniform vec3 g_CameraPosition;
#endif

void main(){

    vec4 modelSpacePos = vec4(inPosition, 1.0);
    vec3 modelSpaceNorm = inNormal;

wPosition = TransformWorld(modelSpacePos).xyz;

  //  #if  ( defined(NORMALMAP) || defined(PARALLAXMAP)) && !defined(VERTEX_LIGHTING)
         vec3 modelSpaceTan  = inTangent.xyz;
  //  #endif

    #ifdef NUM_BONES
         #if defined(NORMALMAP) && !defined(VERTEX_LIGHTING)
         Skinning_Compute(modelSpacePos, modelSpaceNorm, modelSpaceTan);
         #else
         Skinning_Compute(modelSpacePos, modelSpaceNorm);
         #endif
    #endif



// VERTEX SHADER CODE FOR GRASS MOVEMENT 
//make dead things droop slightly

float heightVar = 0.5;
#ifdef METALLICMAP
    heightVar = (texture2D(m_MetallicMap, inTexCoord)).r - 0.05;
#endif


    if(heightVar > 0){


float scaleVar = ( gl_Position / modelSpacePos).length();

        float yDrop = (1.0 - m_Liveliness); 
        heightVar *= (1 - yDrop);

        float yValue = heightVar;
        float originalX = modelSpacePos.x;

        float xdifference;

        float timeDirection;
        float timeScale;
        vec2 loc = mod(vec2(inPosition.x, inPosition.z), 500);
        float noise = noise(loc);
        float locTime = g_Time + (inPosition.x/inPosition.z) + (pnoise(vec2(loc.y + (g_Time/1.4), loc.x + (g_Time/1.5)), 3) * 6.0);
        float waveyness =  .025 + (yValue * .01) ; //waveyness 


        float smoothMult = 1.0;

        timeDirection = mod(locTime, 4.0);

        if(timeDirection < 1){ 
            smoothMult = 1.0-(timeDirection*.5);
            timeScale *= -1.0;
            timeScale = mod(locTime, 1.0);
        }
        else if(timeDirection < 2){
            smoothMult = 1.0-((2.0-timeDirection)*.5);
            timeScale = mod(locTime, 1.0);
            timeScale = 1.0 - timeScale;
        }
        else if(timeDirection < 3.0){
            smoothMult = 1.0-((timeDirection-2.0)*.5);

            timeScale = mod(locTime, 1.0);
            timeScale = -timeScale;
            timeScale *= 2.0;
        }
        else{
           smoothMult = 1.0-((4.0-timeDirection)*.5);
           timeScale = mod(locTime, -1);
           timeScale *= 2.0;
        }


     //       xdifference = originalX - modelSpacePos.x;
      //      xdifference *= waveyness;
     //       originalX += (xdifference* (smoothMult));

      //      modelSpacePos.x = originalX;


            float altVar = timeScale * waveyness * pnoise(vec2(loc.y + (g_Time), loc.x + (g_Time)), .5);

      //      modelSpacePos.z -= altVar;
      //      modelSpacePos.y


 //   gl_Position.x += altVar * 3;
    modelSpacePos.x += timeScale * waveyness* yValue;
    modelSpacePos.y  -= altVar;

    // END CHANGES

    }

   
gl_Position = TransformWorldViewProjection(modelSpacePos);

    


//    gl_Position = TransformWorldViewProjection(modelSpacePos);
    texCoord = inTexCoord;
    #ifdef SEPARATE_TEXCOORD
       texCoord2 = inTexCoord2;
    #endif

    
    wNormal  = TransformWorldNormal(modelSpaceNorm);

 //   #if defined(NORMALMAP) || defined(PARALLAXMAP)
      wTangent = vec4(TransformWorldNormal(modelSpaceTan),inTangent.w);
  //  #endif

    Color = m_BaseColor;
    
    #ifdef VERTEX_COLOR                    
        Color *= inColor;
    #endif
    
     #ifdef USE_FOG
        fogDistance = distance(g_CameraPosition, (g_WorldMatrix * modelSpacePos).xyz);
    #endif
    
}