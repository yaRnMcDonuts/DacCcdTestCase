attribute vec3 inPosition;

uniform mat4 g_WorldViewProjectionMatrix;
uniform float g_Time;
uniform float waveynessScale;


void main(){

    vec4 position = vec4(inPosition, 1.0);

    float yValue = inPosition.y;
    float originalX = position.x;

    float xdifference;

    float timeDirection;
    float timeScale;

    float smoothMult = 1;

    timeDirection = mod(g_Time, 4);
    
    if(timeDirection < 1){ 
      smoothMult = 1-(timeDirection*.5);
        timeScale *= -1;
        timeScale = mod(g_Time, 1);
    }
    else if(timeDirection < 2){
        smoothMult = 1-((2-timeDirection)*.5);
        timeScale = mod(g_Time, 1);
        timeScale = 1 - timeScale;
    }
    else if(timeDirection < 3){
        smoothMult = 1-((timeDirection-2)*.5);
        
        timeScale = mod(g_Time, 1);
        timeScale = -timeScale;
        timeScale *= 1.2f;
    }
    else{
    smoothMult = 1-((4-timeDirection)*.5);
     timeScale = mod(g_Time, -1);
     timeScale *= 1.2f;
    }

    if(yValue > 10){  // .01 is speed      \/
        position.x = (timeScale * yValue * .06) + position.x;

        xdifference = originalX - position.x;
        xdifference *= (yValue * .02); //waveyness scale
        originalX += (xdifference* (smoothMult));

        position.x = originalX;
    }

    gl_Position = g_WorldViewProjectionMatrix * position;

}
