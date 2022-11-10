#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Instancing.glsllib"
#import "Common/ShaderLib/Skinning.glsllib"


uniform float g_Time;
uniform float m_ChargeCount;

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

varying vec4 vertColor;

float rand2D(in vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
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


void main(){
    vec4 color = vec4(1.0);
    float timeDirection = mod((g_Time), 1);

    float yCoord = texCoord1.y + timeDirection * (.2 + m_ChargeCount);
    float xCoord = texCoord1.x + timeDirection * m_ChargeCount * 3;

if(yCoord > .99){
    yCoord -= 1;
}
if(xCoord > .99){
    xCoord -= 1;
}

    

    #ifdef HAS_COLORMAP
        vec2 newSpot = vec2(xCoord , yCoord);

        color *= texture2D(m_ColorMap, newSpot);     
    #endif


    #ifdef HAS_LIGHTMAP
        #ifdef SEPARATE_TEXCOORD
            color.rgb *= texture2D(m_LightMap, texCoord2).rgb;
        #else
            color.rgb *= texture2D(m_LightMap, texCoord1).rgb;
        #endif
    #endif

    #if defined(DISCARD_ALPHA)


        if(color.a < m_AlphaDiscardThreshold){
      //      discard;
        }
    #endif



           color.a *= (m_ChargeCount * 1);
            vec3 input = vec3(vertCoords.x - g_Time, vertCoords.y - g_Time, (vertCoords.z + g_Time * 2));

            float variation = smoothstep(0.45 , 0.7, vertCoords.x) * (1.0 - smoothstep(0.3, 0.65, vertCoords.y));
    //        float variation = Noise3D(input, .24);
            variation = Noise3D(vec3(input.x + Noise3D(vec3(input.x,input.y,234), .25), input.y + Noise3D(vec3(input.x,input.y,6544), .25), variation), .24);

            

           color = vec4(1, .97 ,.83, variation / (m_ChargeCount * .85) );
           


    gl_FragColor = color;

}


