#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/PBR.glsllib"
#import "Common/ShaderLib/BlinnPhongLighting.glsllib"
#import "MatDefs/ShaderLib/AfflictionLib.glsllib"



uniform float m_Shininess;
uniform vec4 g_LightDirection;

varying vec4 AmbientSum;
varying vec4 DiffuseSum;
varying vec4 SpecularSum;

varying vec3 vNormal;
varying vec2 texCoord;
varying vec3 vPosition;
varying vec3 vnPosition;
varying vec3 vViewDir;
varying vec4 vLightDir;
varying vec4 vnLightDir;
varying vec3 lightVec;

varying vec3 wPosition;


uniform int m_AfflictionMode_0;
uniform int m_AfflictionMode_1;
uniform int m_AfflictionMode_2;
uniform int m_AfflictionMode_3;
uniform int m_AfflictionMode_4;
uniform int m_AfflictionMode_5;
uniform int m_AfflictionMode_6;
uniform int m_AfflictionMode_7;
uniform int m_AfflictionMode_8;
uniform int m_AfflictionMode_9;
uniform int m_AfflictionMode_10;
uniform int m_AfflictionMode_11;

#ifdef AFFLICTIONTEXTURE
    uniform sampler2D m_AfflictionAlphaMap;
#endif

uniform int m_AfflictionSplatScale;
#ifdef AFFLICTIONALBEDOMAP
    uniform sampler2D m_SplatAlbedoMap ;
#endif

#ifdef AFFLICTIONNORMALMAP
    uniform sampler2D m_SplatNormalMap ;
#endif



#ifdef DIFFUSEMAP
  uniform sampler2D m_DiffuseMap;
#endif
#ifdef DIFFUSEMAP_1
  uniform sampler2D m_DiffuseMap_1;
#endif
#ifdef DIFFUSEMAP_2
  uniform sampler2D m_DiffuseMap_2;
#endif
#ifdef DIFFUSEMAP_3
  uniform sampler2D m_DiffuseMap_3;
#endif
#ifdef DIFFUSEMAP_4
  uniform sampler2D m_DiffuseMap_4;
#endif
#ifdef DIFFUSEMAP_5
  uniform sampler2D m_DiffuseMap_5;
#endif
#ifdef DIFFUSEMAP_6
  uniform sampler2D m_DiffuseMap_6;
#endif
#ifdef DIFFUSEMAP_7
  uniform sampler2D m_DiffuseMap_7;
#endif
#ifdef DIFFUSEMAP_8
  uniform sampler2D m_DiffuseMap_8;
#endif
#ifdef DIFFUSEMAP_9
  uniform sampler2D m_DiffuseMap_9;
#endif
#ifdef DIFFUSEMAP_10
  uniform sampler2D m_DiffuseMap_10;
#endif
#ifdef DIFFUSEMAP_11
  uniform sampler2D m_DiffuseMap_11;
#endif


#ifdef DIFFUSEMAP_0_SCALE
  uniform float m_DiffuseMap_0_scale;
#endif
#ifdef DIFFUSEMAP_1_SCALE
  uniform float m_DiffuseMap_1_scale;
#endif
#ifdef DIFFUSEMAP_2_SCALE
  uniform float m_DiffuseMap_2_scale;
#endif
#ifdef DIFFUSEMAP_3_SCALE
  uniform float m_DiffuseMap_3_scale;
#endif
#ifdef DIFFUSEMAP_4_SCALE
  uniform float m_DiffuseMap_4_scale;
#endif
#ifdef DIFFUSEMAP_5_SCALE
  uniform float m_DiffuseMap_5_scale;
#endif
#ifdef DIFFUSEMAP_6_SCALE
  uniform float m_DiffuseMap_6_scale;
#endif
#ifdef DIFFUSEMAP_7_SCALE
  uniform float m_DiffuseMap_7_scale;
#endif
#ifdef DIFFUSEMAP_8_SCALE
  uniform float m_DiffuseMap_8_scale;
#endif
#ifdef DIFFUSEMAP_9_SCALE
  uniform float m_DiffuseMap_9_scale;
#endif
#ifdef DIFFUSEMAP_10_SCALE
  uniform float m_DiffuseMap_10_scale;
#endif
#ifdef DIFFUSEMAP_11_SCALE
  uniform float m_DiffuseMap_11_scale;
#endif


#ifdef ALPHAMAP
  uniform sampler2D m_AlphaMap;
#endif
#ifdef ALPHAMAP_1
  uniform sampler2D m_AlphaMap_1;
#endif
#ifdef ALPHAMAP_2
  uniform sampler2D m_AlphaMap_2;
#endif

#ifdef NORMALMAP
  uniform sampler2D m_NormalMap;
#endif
#ifdef NORMALMAP_1
  uniform sampler2D m_NormalMap_1;
#endif
#ifdef NORMALMAP_2
  uniform sampler2D m_NormalMap_2;
#endif
#ifdef NORMALMAP_3
  uniform sampler2D m_NormalMap_3;
#endif
#ifdef NORMALMAP_4
  uniform sampler2D m_NormalMap_4;
#endif
#ifdef NORMALMAP_5
  uniform sampler2D m_NormalMap_5;
#endif
#ifdef NORMALMAP_6
  uniform sampler2D m_NormalMap_6;
#endif
#ifdef NORMALMAP_7
  uniform sampler2D m_NormalMap_7;
#endif
#ifdef NORMALMAP_8
  uniform sampler2D m_NormalMap_8;
#endif
#ifdef NORMALMAP_9
  uniform sampler2D m_NormalMap_9;
#endif
#ifdef NORMALMAP_10
  uniform sampler2D m_NormalMap_10;
#endif
#ifdef NORMALMAP_11
  uniform sampler2D m_NormalMap_11;
#endif


#ifdef TRI_PLANAR_MAPPING
  varying vec4 wVertex;
  
#endif
varying vec3 wNormal;


vec2 coord;
vec3 normal;
float livelinessValue;
float afflictionValue;
int afflictionMode;
vec4 afflictionVector;
vec4 tempDiffuse, diffuse;
vec4 emissive;

#define DEFINE_COORD(index) vec2 coord##index = texCoord * m_DiffuseMap##index##_scale;


#define BLEND(index, ab)\
    DEFINE_COORD(index)\
    afflictionMode = m_AfflictionMode##index;\
    tempDiffuse.rgb = texture2D(m_DiffuseMap##index, coord##index).rgb;\
    tempDiffuse.rgb = alterLiveliness(tempDiffuse.rgb, livelinessValue, afflictionMode);\
    diffuse.rgb = mix( diffuse.rgb, tempDiffuse.rgb ,ab );
  
    

#define BLEND_NORMAL(index, ab)\
    DEFINE_COORD(index)\
    afflictionMode = m_AfflictionMode##index;\
    tempDiffuse.rgb = texture2D(m_DiffuseMap##index, coord##index).rgb;\
    tempDiffuse.rgb = alterLiveliness(tempDiffuse.rgb, livelinessValue, afflictionMode);\
    diffuse.rgb = mix( diffuse.rgb, tempDiffuse.rgb ,ab );\
    normal += texture2D(m_NormalMap##index, coord##index).xyz * ab;


//methods for the 0 index, which does not use "_0" for the 0 index of 'm_DiffuseMap' and 'm_NormalMap', although the scale and all other variables for the 0 index do use the '_0'
#define BLEND_0_INDEX(index, ab)\
    DEFINE_COORD(index)\
    afflictionMode = m_AfflictionMode##index;\
    tempDiffuse.rgb = texture2D(m_DiffuseMap, coord##index).rgb;\
    tempDiffuse.rgb = alterLiveliness(tempDiffuse.rgb, livelinessValue, afflictionMode);\
    diffuse.rgb = mix(diffuse.rgb, tempDiffuse.rgb, ab);
      

#define BLEND_NORMAL_0_INDEX(index, ab)\
    DEFINE_COORD(index)\
    afflictionMode = m_AfflictionMode##index;\
    tempDiffuse.rgb = texture2D(m_DiffuseMap, coord##index).rgb;\
    tempDiffuse.rgb = alterLiveliness(tempDiffuse.rgb, livelinessValue, afflictionMode);\
    diffuse.rgb = mix(diffuse.rgb, tempDiffuse.rgb, ab);\
    normal += texture2D(m_NormalMap, coord##index).xyz * ab;

#ifdef ALPHAMAP

vec4 calculateDiffuseBlend(in vec2 texCoord) {

    vec4 alphaBlend = texture2D( m_AlphaMap, texCoord.xy );
    diffuse = vec4(1.0);
    




    #ifdef ALPHAMAP_1
      vec4 alphaBlend1   = texture2D( m_AlphaMap_1, texCoord.xy );
    #endif
    #ifdef ALPHAMAP_2
      vec4 alphaBlend2   = texture2D( m_AlphaMap_2, texCoord.xy );
    #endif
    #ifdef DIFFUSEMAP  
                    //NOTE! the old (phong) terrain shaders do not have an "_0" for the first diffuse map, it is just "DiffuseMap"
        #ifdef NORMALMAP
            BLEND_NORMAL_0_INDEX(_0, alphaBlend.r)
        #else
            BLEND_0_INDEX(_0,  alphaBlend.r)
        #endif
        
    #endif
    #ifdef DIFFUSEMAP_1
        #ifdef NORMALMAP_1
            BLEND_NORMAL(_1,  alphaBlend.g)
        #else
            BLEND(_1,  alphaBlend.g)
        #endif
        
    #endif
    #ifdef DIFFUSEMAP_2
        #ifdef NORMALMAP_2
            BLEND_NORMAL(_2,  alphaBlend.b)
        #else
            BLEND(_2,  alphaBlend.b)
        #endif
        
    #endif
    #ifdef DIFFUSEMAP_3 
        #ifdef NORMALMAP_3
            BLEND_NORMAL(_3,  alphaBlend.a)
        #else
            BLEND(_3,  alphaBlend.a)
        #endif
       
    #endif

    #ifdef ALPHAMAP_1
        #ifdef DIFFUSEMAP_4
            #ifdef NORMALMAP_4
                BLEND_NORMAL(_4,  alphaBlend1.r)
            #else
                BLEND(_4,  alphaBlend1.r)
            #endif
           
        #endif
        #ifdef DIFFUSEMAP_5
            #ifdef NORMALMAP_5
                BLEND_NORMAL(_5,  alphaBlend1.g)
            #else
                BLEND(_5,  alphaBlend1.g)
            #endif
             
        #endif
        #ifdef DIFFUSEMAP_6
            #ifdef NORMALMAP_6
                BLEND_NORMAL(_6,  alphaBlend1.b)
            #else
                BLEND(_6,  alphaBlend1.b)
            #endif
             
        #endif
        #ifdef DIFFUSEMAP_7
            #ifdef NORMALMAP_7
                BLEND_NORMAL(_7,  alphaBlend1.a)
            #else
                BLEND(_7,  alphaBlend1.a)
            #endif
             
        #endif
    #endif

    #ifdef ALPHAMAP_2
        #ifdef DIFFUSEMAP_8
             #ifdef NORMALMAP_8
                BLEND_NORMAL(_8,  alphaBlend2.r)
            #else
                BLEND(_8,  alphaBlend2.r)
            #endif
             
        #endif
        #ifdef DIFFUSEMAP_9
             #ifdef NORMALMAP_9
                BLEND_NORMAL(_9,  alphaBlend2.g)
            #else
                BLEND(_9,  alphaBlend2.g)
            #endif
             
        #endif
        #ifdef DIFFUSEMAP_10
            #ifdef NORMALMAP_10
                BLEND_NORMAL(_10,  alphaBlend2.b)
            #else
                BLEND(_10,  alphaBlend2.b)
            #endif
             
        #endif
        #ifdef DIFFUSEMAP_11
             #ifdef NORMALMAP_11
                BLEND_NORMAL(_11,  alphaBlend2.a)
            #else
                BLEND(_11,  alphaBlend2.a)
            #endif
             
        #endif                   
    #endif

    return diffuse;
  }

  vec3 calculateNormal(in vec2 texCoord) {
    vec3 normal = vec3(0,0,1);
    vec3 n = vec3(0,0,0);

    vec4 alphaBlend = texture2D( m_AlphaMap, texCoord.xy );

    #ifdef ALPHAMAP_1
      vec4 alphaBlend1 = texture2D( m_AlphaMap_1, texCoord.xy );
    #endif
    #ifdef ALPHAMAP_2
      vec4 alphaBlend2 = texture2D( m_AlphaMap_2, texCoord.xy );
    #endif

    #ifdef NORMALMAP
      n = texture2D(m_NormalMap, texCoord * m_DiffuseMap_0_scale).xyz;
      normal += n * alphaBlend.r;
    #else
      normal += vec3(0.5,0.5,1) * alphaBlend.r;
    #endif

    #ifdef NORMALMAP_1
      n = texture2D(m_NormalMap_1, texCoord * m_DiffuseMap_1_scale).xyz;
      normal += n * alphaBlend.g;
    #else
      normal += vec3(0.5,0.5,1) * alphaBlend.g;
    #endif

    #ifdef NORMALMAP_2
      n = texture2D(m_NormalMap_2, texCoord * m_DiffuseMap_2_scale).xyz;
      normal += n * alphaBlend.b;
    #else
      normal += vec3(0.5,0.5,1) * alphaBlend.b;
    #endif

    #ifdef NORMALMAP_3
      n = texture2D(m_NormalMap_3, texCoord * m_DiffuseMap_3_scale).xyz;
      normal += n * alphaBlend.a;
    #else
      normal += vec3(0.5,0.5,1) * alphaBlend.a;
    #endif

    #ifdef ALPHAMAP_1
        #ifdef NORMALMAP_4
          n = texture2D(m_NormalMap_4, texCoord * m_DiffuseMap_4_scale).xyz;
          normal += n * alphaBlend1.r;
        #endif

        #ifdef NORMALMAP_5
          n = texture2D(m_NormalMap_5, texCoord * m_DiffuseMap_5_scale).xyz;
          normal += n * alphaBlend1.g;
        #endif

        #ifdef NORMALMAP_6
          n = texture2D(m_NormalMap_6, texCoord * m_DiffuseMap_6_scale).xyz;
          normal += n * alphaBlend1.b;
        #endif

        #ifdef NORMALMAP_7
          n = texture2D(m_NormalMap_7, texCoord * m_DiffuseMap_7_scale).xyz;
          normal += n * alphaBlend1.a;
        #endif
    #endif

    #ifdef ALPHAMAP_2
        #ifdef NORMALMAP_8
          n = texture2D(m_NormalMap_8, texCoord * m_DiffuseMap_8_scale).xyz;
          normal += n * alphaBlend2.r;
        #endif

        #ifdef NORMALMAP_9
          n = texture2D(m_NormalMap_9, texCoord * m_DiffuseMap_9_scale);
          normal += n * alphaBlend2.g;
        #endif

        #ifdef NORMALMAP_10
          n = texture2D(m_NormalMap_10, texCoord * m_DiffuseMap_10_scale);
          normal += n * alphaBlend2.b;
        #endif

        #ifdef NORMALMAP_11
          n = texture2D(m_NormalMap_11, texCoord * m_DiffuseMap_11_scale);
          normal += n * alphaBlend2.a;
        #endif
    #endif

    normal = (normal.xyz * vec3(2.0) - vec3(1.0));
    return normalize(normal);
  }

  #ifdef TRI_PLANAR_MAPPING


    vec4 calculateTriPlanarDiffuseBlend(in vec3 wNorm, in vec4 wVert, in vec2 texCoord) {
        // tri-planar texture bending factor for this fragment's normal
        vec3 blending = abs( wNorm );
        blending = (blending -0.2) * 0.7;
        blending = normalize(max(blending, 0.00001));      // Force weights to sum to 1.0 (very important!)
        float b = (blending.x + blending.y + blending.z);
        blending /= vec3(b, b, b);

        // texture coords
        vec4 coords = wVert;

        // blend the results of the 3 planar projections.
        vec4 tex0 = getTriPlanarBlend(coords, blending, m_DiffuseMap, m_DiffuseMap_0_scale);

        #ifdef DIFFUSEMAP_1
          // blend the results of the 3 planar projections.
          vec4 tex1 = getTriPlanarBlend(coords, blending, m_DiffuseMap_1, m_DiffuseMap_1_scale);
        #endif
        #ifdef DIFFUSEMAP_2
          // blend the results of the 3 planar projections.
          vec4 tex2 = getTriPlanarBlend(coords, blending, m_DiffuseMap_2, m_DiffuseMap_2_scale);
        #endif
        #ifdef DIFFUSEMAP_3
          // blend the results of the 3 planar projections.
          vec4 tex3 = getTriPlanarBlend(coords, blending, m_DiffuseMap_3, m_DiffuseMap_3_scale);
        #endif
        #ifdef DIFFUSEMAP_4
          // blend the results of the 3 planar projections.
          vec4 tex4 = getTriPlanarBlend(coords, blending, m_DiffuseMap_4, m_DiffuseMap_4_scale);
        #endif
        #ifdef DIFFUSEMAP_5
          // blend the results of the 3 planar projections.
          vec4 tex5 = getTriPlanarBlend(coords, blending, m_DiffuseMap_5, m_DiffuseMap_5_scale);
        #endif
        #ifdef DIFFUSEMAP_6
          // blend the results of the 3 planar projections.
          vec4 tex6 = getTriPlanarBlend(coords, blending, m_DiffuseMap_6, m_DiffuseMap_6_scale);
        #endif
        #ifdef DIFFUSEMAP_7
          // blend the results of the 3 planar projections.
          vec4 tex7 = getTriPlanarBlend(coords, blending, m_DiffuseMap_7, m_DiffuseMap_7_scale);
        #endif
        #ifdef DIFFUSEMAP_8
          // blend the results of the 3 planar projections.
          vec4 tex8 = getTriPlanarBlend(coords, blending, m_DiffuseMap_8, m_DiffuseMap_8_scale);
        #endif
        #ifdef DIFFUSEMAP_9
          // blend the results of the 3 planar projections.
          vec4 tex9 = getTriPlanarBlend(coords, blending, m_DiffuseMap_9, m_DiffuseMap_9_scale);
        #endif
        #ifdef DIFFUSEMAP_10
          // blend the results of the 3 planar projections.
          vec4 tex10 = getTriPlanarBlend(coords, blending, m_DiffuseMap_10, m_DiffuseMap_10_scale);
        #endif
        #ifdef DIFFUSEMAP_11
          // blend the results of the 3 planar projections.
          vec4 tex11 = getTriPlanarBlend(coords, blending, m_DiffuseMap_11, m_DiffuseMap_11_scale);
        #endif

        vec4 alphaBlend   = texture2D( m_AlphaMap, texCoord.xy );

        #ifdef ALPHAMAP_1
          vec4 alphaBlend1   = texture2D( m_AlphaMap_1, texCoord.xy );
        #endif
        #ifdef ALPHAMAP_2
          vec4 alphaBlend2   = texture2D( m_AlphaMap_2, texCoord.xy );
        #endif

        vec4 diffuseColor = tex0 * alphaBlend.r;
        #ifdef DIFFUSEMAP_1
            diffuseColor = mix( diffuseColor, tex1, alphaBlend.g );
        #endif
        #ifdef DIFFUSEMAP_2
            diffuseColor = mix( diffuseColor, tex2, alphaBlend.b );
        #endif
        #ifdef DIFFUSEMAP_3
            diffuseColor = mix( diffuseColor, tex3, alphaBlend.a );
        #endif
        #ifdef ALPHAMAP_1
            #ifdef DIFFUSEMAP_4
                diffuseColor = mix( diffuseColor, tex4, alphaBlend1.r );
            #endif
            #ifdef DIFFUSEMAP_5
                diffuseColor = mix( diffuseColor, tex5, alphaBlend1.g );
            #endif
            #ifdef DIFFUSEMAP_6
                diffuseColor = mix( diffuseColor, tex6, alphaBlend1.b );
            #endif
            #ifdef DIFFUSEMAP_7
                diffuseColor = mix( diffuseColor, tex7, alphaBlend1.a );
            #endif
        #endif
        #ifdef ALPHAMAP_2
            #ifdef DIFFUSEMAP_8
                diffuseColor = mix( diffuseColor, tex8, alphaBlend2.r );
            #endif
            #ifdef DIFFUSEMAP_9
                diffuseColor = mix( diffuseColor, tex9, alphaBlend2.g );
            #endif
            #ifdef DIFFUSEMAP_10
                diffuseColor = mix( diffuseColor, tex10, alphaBlend2.b );
            #endif
            #ifdef DIFFUSEMAP_11
                diffuseColor = mix( diffuseColor, tex11, alphaBlend2.a );
            #endif
        #endif

        return diffuseColor;
    }

    vec3 calculateNormalTriPlanar(in vec3 wNorm, in vec4 wVert,in vec2 texCoord) {
      // tri-planar texture bending factor for this fragment's world-space normal
      vec3 blending = abs( wNorm );
      blending = (blending -0.2) * 0.7;
      blending = normalize(max(blending, 0.00001));      // Force weights to sum to 1.0 (very important!)
      float b = (blending.x + blending.y + blending.z);
      blending /= vec3(b, b, b);

      // texture coords
      vec4 coords = wVert;
      vec4 alphaBlend = texture2D( m_AlphaMap, texCoord.xy );

      #ifdef ALPHAMAP_1
        vec4 alphaBlend1 = texture2D( m_AlphaMap_1, texCoord.xy );
      #endif
      #ifdef ALPHAMAP_2
        vec4 alphaBlend2 = texture2D( m_AlphaMap_2, texCoord.xy );
      #endif

      vec3 normal = vec3(0,0,1);
      vec3 n = vec3(0,0,0);

      #ifdef NORMALMAP
          n = getTriPlanarBlend(coords, blending, m_NormalMap, m_DiffuseMap_0_scale).xyz;
          normal += n * alphaBlend.r;
      #else
          normal += vec3(0.5,0.5,1) * alphaBlend.r;
      #endif

      #ifdef NORMALMAP_1
          n = getTriPlanarBlend(coords, blending, m_NormalMap_1, m_DiffuseMap_1_scale).xyz;
          normal += n * alphaBlend.g;
      #else
          normal += vec3(0.5,0.5,1) * alphaBlend.g;
      #endif

      #ifdef NORMALMAP_2
          n = getTriPlanarBlend(coords, blending, m_NormalMap_2, m_DiffuseMap_2_scale).xyz;
          normal += n * alphaBlend.b;
      #else
          normal += vec3(0.5,0.5,1) * alphaBlend.b;
      #endif

      #ifdef NORMALMAP_3
          n = getTriPlanarBlend(coords, blending, m_NormalMap_3, m_DiffuseMap_3_scale).xyz;
          normal += n * alphaBlend.a;
      #else
          normal += vec3(0.5,0.5,1) * alphaBlend.a;
      #endif

      #ifdef ALPHAMAP_1
          #ifdef NORMALMAP_4
              n = getTriPlanarBlend(coords, blending, m_NormalMap_4, m_DiffuseMap_4_scale).xyz;
              normal += n * alphaBlend1.r;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.r;
          #endif

          #ifdef NORMALMAP_5
              n = getTriPlanarBlend(coords, blending, m_NormalMap_5, m_DiffuseMap_5_scale).xyz;
              normal += n * alphaBlend1.g;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.g;
          #endif

          #ifdef NORMALMAP_6
              n = getTriPlanarBlend(coords, blending, m_NormalMap_6, m_DiffuseMap_6_scale).xyz;
              normal += n * alphaBlend1.b;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.b;
          #endif

          #ifdef NORMALMAP_7
              n = getTriPlanarBlend(coords, blending, m_NormalMap_7, m_DiffuseMap_7_scale).xyz;
              normal += n * alphaBlend1.a;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.a;
          #endif
      #endif

      #ifdef ALPHAMAP_2
          #ifdef NORMALMAP_8
              n = getTriPlanarBlend(coords, blending, m_NormalMap_8, m_DiffuseMap_8_scale).xyz;
              normal += n * alphaBlend2.r;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.r;
          #endif

          #ifdef NORMALMAP_9
              n = getTriPlanarBlend(coords, blending, m_NormalMap_9, m_DiffuseMap_9_scale).xyz;
              normal += n * alphaBlend2.g;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.g;
          #endif

          #ifdef NORMALMAP_10
              n = getTriPlanarBlend(coords, blending, m_NormalMap_10, m_DiffuseMap_10_scale).xyz;
              normal += n * alphaBlend2.b;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.b;
          #endif

          #ifdef NORMALMAP_11
              n = getTriPlanarBlend(coords, blending, m_NormalMap_11, m_DiffuseMap_11_scale).xyz;
              normal += n * alphaBlend2.a;
          #else
              normal += vec3(0.5,0.5,1) * alphaBlend.a;
          #endif
      #endif

      normal = (normal.xyz * vec3(2.0) - vec3(1.0));
      return normalize(normal);
    }
  #endif

#endif


mat3 tbnMat;

#if defined(NORMALMAP_0) || defined(NORMALMAP_1) || defined(NORMALMAP_2) || defined(NORMALMAP_3) || defined(NORMALMAP_4) || defined(NORMALMAP_5) || defined(NORMALMAP_6) || defined(NORMALMAP_7) || defined(AFFLICTIONNORMALMAP)
    varying vec4 wTangent;
#endif

void main(){
    normal = vec3(0,0,1);
    //----------------------
    // diffuse calculations
    //----------------------

    afflictionVector = vec4(1.0, 0.0, 0.0, 0.0);
    #ifdef AFFLICTIONTEXTURE
        afflictionVector = texture2D(m_AfflictionAlphaMap, texCoord.xy).rgba;
    #endif

    livelinessValue = afflictionVector.r;
    afflictionValue = afflictionVector.g;
 

#if defined(NORMALMAP_0) || defined(PARALLAXMAP) || defined(AFFLICTIONNORMALMAP)
vec3 norm = normalize(wNormal);
        vec3 tan = normalize(wTangent.xyz);
   //     tbnMat = mat3(tan, wTangent.w * cross( (wNormal), (tan)), norm);

      mat3 tbnMat = mat3(tan, wTangent.w * cross( (norm), (tan)), norm);
   

    #endif

    #ifdef DIFFUSEMAP
      #ifdef ALPHAMAP
        #ifdef TRI_PLANAR_MAPPING
            vec4 diffuseColor = calculateTriPlanarDiffuseBlend(wNormal, wVertex, texCoord);
        #else
            vec4 diffuseColor = calculateDiffuseBlend(texCoord);
        #endif
      #else
        vec4 diffuseColor = texture2D(m_DiffuseMap, texCoord);
      #endif
    #else
      vec4 diffuseColor = vec4(1.0);
    #endif

        float spotFallOff = 1.0;
        if(g_LightDirection.w!=0.0){
              vec3 L=normalize(lightVec.xyz);
              vec3 spotdir = normalize(g_LightDirection.xyz);
              float curAngleCos = dot(-L, spotdir);             
              float innerAngleCos = floor(g_LightDirection.w) * 0.001;
              float outerAngleCos = fract(g_LightDirection.w);
              float innerMinusOuter = innerAngleCos - outerAngleCos;

              spotFallOff = (curAngleCos - outerAngleCos) / innerMinusOuter;

              if(spotFallOff <= 0.0){
                  gl_FragColor = AmbientSum * diffuseColor;
                  return;
              }else{
                  spotFallOff = clamp(spotFallOff, 0.0, 1.0);
              }
        }


    //---------------------
    // normal calculations
    //---------------------
    #if defined(NORMALMAP) || defined(NORMALMAP_1) || defined(NORMALMAP_2) || defined(NORMALMAP_3) || defined(NORMALMAP_4) || defined(NORMALMAP_5) || defined(NORMALMAP_6) || defined(NORMALMAP_7) || defined(NORMALMAP_8) || defined(NORMALMAP_9) || defined(NORMALMAP_10) || defined(NORMALMAP_11)
      #ifdef TRI_PLANAR_MAPPING
        vec3 normal = calculateNormalTriPlanar(wNormal, wVertex, texCoord);
      #else
    //    vec3 normal = calculateNormal(texCoord);     already done in the "caclulateDiffuse" method so long as normal map exists
      #endif
    #else
      vec3 normal = vNormal;
    #endif

//    normal = (normal.xyz * vec3(2.0) - vec3(1.0));


//afflictionness
vec4 afflictionAlbedo;   
float noiseHash;
vec4 afflictionGlowColor = vec4(0.87, 0.95, 0.1, 1.0);
vec2 newScaledCoords = mod(texCoord * m_AfflictionSplatScale, 1);
#ifdef AFFLICTIONALBEDOMAP
    afflictionAlbedo = texture2D(m_SplatAlbedoMap , newScaledCoords);
#else
    afflictionAlbedo = vec4(0.55, 0.8, 0.00, 1.0);
#endif

vec3 afflictionNormal;
#ifdef AFFLICTIONNORMALMAP
    afflictionNormal = texture2D(m_SplatNormalMap , newScaledCoords).rgb;
#else
    afflictionNormal = vec3(0.5, 0.5, 1.0); 

#endif



    noiseHash = getStaticNoiseVar0(wPosition, afflictionValue);
    diffuseColor = alterAfflictionColor(afflictionValue, diffuseColor, afflictionAlbedo, noiseHash * diffuseColor.a);
    normal = alterAfflictionNormals(afflictionValue, normal, afflictionNormal,  noiseHash * afflictionAlbedo.a);//use the alpha channel of albedo map to alter opcaity for the matching affliction normals, roughness, and metalicness at each pixe
 //   afflictionGlowColor = alterAfflictionGlow(afflictionValue, afflictionGlowColor, noiseHash);

    afflictionGlowColor = vec4(0);


//end afflictionness
 //-----------------------
    // lighting calculations
    //-----------------------
    vec4 lightDir = vLightDir;
    lightDir.xyz = normalize(lightDir.xyz);

    vec2 light = computeLighting(normal, vViewDir.xyz, lightDir.xyz,lightDir.w*spotFallOff,m_Shininess);

    vec4 specularColor = vec4(1.0);

    //--------------------------
    // final color calculations
    //--------------------------
    gl_FragColor =  AmbientSum * diffuseColor +
                    DiffuseSum * diffuseColor  * light.x +
                    SpecularSum * specularColor * light.y;


//  gl_FragColor = AmbientSum * diffuseColor;

  //  gl_FragColor.rgb = vec3(0.1);

    //gl_FragColor.a = alpha;
    
}