#import "Common/ShaderLib/GLSLCompat.glsllib"
#import "Common/ShaderLib/Optics.glsllib"

uniform ENVMAP m_Texture;

uniform vec4 m_Color;

varying vec3 direction;


#ifdef FINAL_TEXTURE

    uniform ENVMAP m_FinalTexture; 
    
    uniform float m_InterpolationValue;
#endif

void main() {
    
    vec3 dir = normalize(direction);
    
    vec4 outputColor = Optics_GetEnvColor(m_Texture, dir);
    
    #ifdef FINAL_TEXTURE
    
        vec4 finalColor = Optics_GetEnvColor(m_FinalTexture, dir);
        
        outputColor = mix(outputColor, finalColor, m_InterpolationValue);
    
    #endif
    
    
    gl_FragColor = outputColor * m_Color;
}
