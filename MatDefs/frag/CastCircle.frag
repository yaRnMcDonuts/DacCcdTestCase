#import "Common/ShaderLib/GLSLCompat.glsllib"


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

#if defined(HAS_GLOWMAP) || defined(HAS_COLORMAP) || (defined(HAS_LIGHTMAP) && !defined(SEPARATE_TEXCOORD))
    #define NEED_TEXCOORD1
#endif

#if defined(DISCARD_ALPHA)
    uniform float m_AlphaDiscardThreshold;
#endif

uniform sampler2D m_UvMap;
uniform float m_Percent;
uniform bool m_Canceled;

uniform vec4 m_Color;
uniform sampler2D m_ColorMap;
uniform sampler2D m_AlternateColorMap;
uniform sampler2D m_LightMap;

varying vec2 texCoord1;
varying vec2 texCoord2;

varying vec4 vertColor;

varying vec3 vertCoords;

float alpha = 1;


void main(){
    vec4 originalColor = vec4(1.0);
    vec4 color = vec4(1.0);
    
    vec4 alternateColor = vec4(0.2);

    #ifdef HAS_COLORMAP
        originalColor = texture2D(m_ColorMap, texCoord1);     
        color = originalColor.rgba;
    #endif
    
    #ifdef HAS_ALTERNATECOLORMAP
        alternateColor = texture2D(m_AlternateColorMap, texCoord1);     
    #endif

    #ifdef HAS_VERTEXCOLOR
        color *= vertColor;
    #endif

    #ifdef HAS_COLOR
        color *= m_Color;
    #endif

    #ifdef HAS_LIGHTMAP
        #ifdef SEPARATE_TEXCOORD
            color.rgb *= texture2D(m_LightMap, texCoord2).rgb;
            texCoord1 = texCoord2;
        #else
            color.rgb *= texture2D(m_LightMap, texCoord1).rgb;
        #endif
    #endif

    #if defined(DISCARD_ALPHA)
        if(color.a < m_AlphaDiscardThreshold){
           discard;
        }
    #endif

    vec4 uvColor = texture2D(m_UvMap, texCoord1);

    
    float distFromCenter =  sqrt( pow(0.5 - texCoord1.x, 2) + pow(0.5 - texCoord1.y, 2) );

    vec3 fillColor = vec3(0.8, 0.6, 0.48); //assign this based on da class? ! ? !


    float portionOfImageForFillZone = 0.42;
    float portionOfImageForInnerStaticCircle = 0.362;

// fill area (b in uvMap) fill animation. note that r channel in uvMap does nothing special while casting, only when complete or cancelled!
    if(uvColor.b > 0.769){
        if(!m_Canceled){
            float currentFillAmount = (m_Percent * portionOfImageForFillZone * 0.5); //accounts for the size of the fill zone (.42 is percentage of texture taken up by by blue fill area, then multiplied
                                                                        // by 0.5 to account for the fact that it is the radius

            float lowLine =  portionOfImageForInnerStaticCircle * 0.5; //accounts for the radial distance from the centerpoint that is part of the inner circle and inner ring that has no animation
            float highLine = (portionOfImageForInnerStaticCircle + 0.008) * 0.5; //not really used anymore...?.

            float noiseVal = (pnoise(texCoord1, 0.007) * 0.06); //for making fill animation look more spadazzled whil filling up

            float amt = m_Percent * 0.37 + 0.55;
            fillColor *= amt;

            
            float mixPct = noiseVal / (highLine - lowLine);

            //filling the areas beneath the current cast % threshold, applying noise for spadazzle
            if(distFromCenter < lowLine + currentFillAmount + noiseVal){

                color.a = amt*0.85;
                color.rbg *= 0.7 + (m_Percent*2);
            }
            else if(distFromCenter <  highLine + currentFillAmount){
                color.a = amt*0.85;
                
                mixPct *= 0.1f;
                color.rgb = color.rgb;
            }
            
            else{  //fill the empty parts of the fill area with the grayed out bark texture from the alternateCastCircleTexture
                color.a = 0.9;
                color.rgb = alternateColor.rgb;
            }


            if(m_Percent > 0.999){
                color.rgba = originalColor.rgba;
                
                color.rgb *= vec3(1.3, 1.9, 0.07);
                
                color.a = 0.92;
            //    color.rgb = mix( color.rgb, vec3(0.95, 1.0, 1.0), noiseVal * 17);
          //      color.a = 0.83 - (distFromCenter*0.3);
            }
        }
        else{
            color *= 0.2;
            color.r += 0.79;
        }
    }
    
    
    if(uvColor.r > 0.5){ // ring areas (r in uvMap)
        if(!m_Canceled){
            if(m_Percent > 0.999){            //makes ring areas brighter yellow when casting is complete
                
                
                color.rgb = originalColor.rgb * vec3(3.8,4, 0.025);
                color.a = 0.92;
            }
        }
        else{ //                                             
            color.rgb = originalColor.rgb * vec3(2.0 ,0.1, 0.05); // when cancelled - colorizes border red
            color.a = 0.9 - (distFromCenter * 0.8); ;
        }
    }

    if(uvColor.b > 0.5){ // fill area (b in uvMap) when cancelled - uses emptyFillArea colorized to be red
        if(m_Canceled){
            color.rgb = alternateColor.rgb * vec3(1.5, 0.3, 0.3);
            color.a = 0.9 - (distFromCenter * 0.5); 
        }    
    }


   color.a *= alpha;


    gl_FragColor = color;
}