


vec3 alterLiveliness(vec3 color, float liveVal, int mode){
//change hue
     
//    liveVal 

    if(mode > 0){ //0 means dont scale to be dead or alive at all (bricks, etc)
        

        
        float deathVar = (1.0 - (liveVal));

        if(mode > 0){ //1 means fully alive. 1 is less alive, and 2 is slightly less but still alive
            deathVar -= mode * 0.03;

            deathVar = max(0.0, deathVar);
        }

        deathVar = min(0.99, deathVar);

        float hueVar = (deathVar) * 0.34;
        color.r += color.r*hueVar * 1.8;
        color.g -= color.g*hueVar;
        color.b -= color.b*hueVar*5.0 ;


       //desaturate
        vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color.rgb));
        gray *= vec3(0.8, 0.75, 0.65);
        color = vec3(mix(color.rgb, gray, (deathVar * 0.95)));
    }


    return color;
}


vec3 alterLiveliness(vec3 color, float livelinessValue){
//change hue

    float deathVar = (1.0 - (livelinessValue));

    float hueVar = (deathVar) * 0.34;
    color.r += color.r*hueVar * 1.8;
    color.g -= color.g*hueVar;
    color.b -= color.b*hueVar*5.0 ;

  
   //desaturate
    vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color.rgb));
    gray *= vec3(0.8, 0.75, 0.65);
    color = vec3(mix(color.rgb, gray, (deathVar * 0.95)));


    return color;
}

