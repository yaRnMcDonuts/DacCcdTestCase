package com.mygame;

import com.jme3.app.SimpleApplication;
import com.jme3.asset.TextureKey;
import com.jme3.bullet.BulletAppState;
import com.jme3.bullet.animation.CenterHeuristic;
import com.jme3.bullet.animation.DynamicAnimControl;
import com.jme3.bullet.animation.LinkConfig;
import com.jme3.bullet.animation.MassHeuristic;
import com.jme3.bullet.animation.RangeOfMotion;
import com.jme3.bullet.animation.ShapeHeuristic;
import com.jme3.bullet.control.RigidBodyControl;
import com.jme3.font.BitmapText;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.light.LightProbe;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector2f;
import com.jme3.math.Vector3f;
import com.jme3.scene.Spatial;
import com.jme3.system.AppSettings;
import com.jme3.terrain.Terrain;
import com.jme3.terrain.geomipmap.TerrainLodControl;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.terrain.geomipmap.lodcalc.DistanceLodCalculator;
import com.jme3.terrain.heightmap.AbstractHeightMap;
import com.jme3.terrain.heightmap.ImageBasedHeightMap;
import com.jme3.texture.Texture;
import com.jme3.texture.Texture.WrapMode;
import java.awt.Dimension;
import java.awt.Toolkit;
import java.util.ArrayList;
import org.lwjgl.opengl.Display;



public class Main extends SimpleApplication {    


    
    
    public static boolean USE_CCD = true;

    private TerrainQuad terrain;    
    private Material matTerrain;
    
    private final int terrainSize = 512;
    private final int patchSize = 256;
    private final float dirtScale = 24;
    private final float darkRockScale = 24;
    private final float snowScale = 64;
    private final float tileRoadScale = 64;
    private final float grassScale = 24;
    private final float marbleScale = 64;
    private final float gravelScale = 64;
    
    private AmbientLight ambientLight;
    private DirectionalLight directionalLight;
    private boolean isNight = false;
    
    private BitmapText keybindingsText;
    
    private final float camMoveSpeed = 50f;
    
    
    //PHYSICS VARS
    
    public BulletAppState bulletAppState;

    public static void main(String[] args) {
        Main app = new Main();
        AppSettings s = new AppSettings(true);
        
        s.put("FrameRate", 140);
        s.put("GammaCorrection", true);
        
//        AppSettings settings = new AppSettings(true);
//        
//        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
//        double width = screenSize.getWidth() * .99f;        
//        double height = screenSize.getHeight()  * .925f;
//        
//
//        
//        settings.put("Width", ((int)width));
//        settings.put("Height", ((int)height));
//        
//                
//        app.setSettings(settings);
        app.start();
       
    }   
    
    public ArrayList<ElfCharacter> loadedElfCharacterNPCs = new ArrayList<>();
    
    private final ActionListener actionListener = new ActionListener() {
        @Override
        public void onAction(String name, boolean pressed, float tpf) {
        
            if (name.equals("spawnModel") && !pressed) {
                
                makeElfNpc();      
            }
        }
    };
    
    private void makeElfNpc(){
        
        Vector3f spawnLoc = cam.getLocation().add(cam.getDirection().normalize().mult(25));
        
        //make sure model doesnt spawn under terrain        
        float terrainPointHeight = ((Terrain)terrain).getHeight(new Vector2f(spawnLoc.getX(), spawnLoc.getZ()));         
        terrainPointHeight += terrain.getWorldTranslation().getY() + 1;        
        
        if(spawnLoc.getY() < terrainPointHeight){
            spawnLoc.setY(terrainPointHeight);
        }
        
        
        ElfCharacter elfCharacter = new ElfCharacter(this, spawnLoc );
        loadedElfCharacterNPCs.add(elfCharacter);

        
        
        elfCharacterToFollowWithCamera = elfCharacter;
        followLaunchedCharacterTime = 6;
        
         
        camChaseDistance = new Vector3f(-1,-1,-1);
        camChaseDistance.normalizeLocal().multLocal(18);

        
       
    }

    
    public void despawnElfNpc(ElfCharacter elfCharacter) {
        
        enqueue(() ->{
            loadedElfCharacterNPCs.remove(elfCharacter);
        });
    }
    
    @Override
    public void simpleInitApp() { 
        
        initPhysics();
                
        setupKeys();        
        setUpTerrain();        
        setUpTerrainMaterial(); 
        setUpLights();        
        setUpCamera();
        

    }
    

    public ElfCharacter elfCharacterToFollowWithCamera;
    public float followLaunchedCharacterTime = 6; 
    public Vector3f camChaseDistance;
    
    private void initPhysics(){
        
        bulletAppState = new BulletAppState();
        stateManager.attach(bulletAppState);
        bulletAppState.setEnabled(true);
        
    }
    
    private void setUpTerrainMaterial() {

        // TERRAIN TEXTURE material
        matTerrain = new Material(assetManager, "Common/MatDefs/Terrain/PBRTerrain.j3md");                
        
        matTerrain.setBoolean("useTriPlanarMapping", false);

        // ALPHA map (for splat textures)
        matTerrain.setTexture("AlphaMap", assetManager.loadTexture("Textures/Terrain/splat/alpha1.png"));
        matTerrain.setTexture("AlphaMap_1", assetManager.loadTexture("Textures/Terrain/splat/alpha2.png"));
        // this material also supports 'AlphaMap_2', so you can get up to 12 diffuse textures

        // HEIGHTMAP image (for the terrain heightmap)
        TextureKey hmKey = new TextureKey("Textures/Terrain/splat/mountains512.png", false);
        Texture heightMapImage = assetManager.loadTexture(hmKey);

        // DIRT texture, Diffuse textures 0 to 3 use the first AlphaMap
        Texture dirt = assetManager.loadTexture("Textures/Terrain/PBR/Ground037_1K_Color.png");
        dirt.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_0", dirt);
        matTerrain.setFloat("AlbedoMap_0_scale", dirtScale);
        matTerrain.setFloat("Roughness_0", 1);
        matTerrain.setFloat("Metallic_0", 0);
        //matTerrain.setInt("AfflictionMode_0", 0);

        // DARK ROCK texture
        Texture darkRock = assetManager.loadTexture("Textures/Terrain/PBR/Rock035_1K_Color.png");
        darkRock.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_1", darkRock);
        matTerrain.setFloat("AlbedoMap_1_scale", darkRockScale);
        matTerrain.setFloat("Roughness_1", 0.92f);
        matTerrain.setFloat("Metallic_1", 0.02f);
        //matTerrain.setInt("AfflictionMode_1", 0);

        // SNOW texture
        Texture snow = assetManager.loadTexture("Textures/Terrain/PBR/Snow006_1K_Color.png");
        snow.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_2", snow);
        matTerrain.setFloat("AlbedoMap_2_scale", snowScale);
        matTerrain.setFloat("Roughness_2", 0.55f);
        matTerrain.setFloat("Metallic_2", 0.12f);
        
        Texture tiles = assetManager.loadTexture("Textures/Terrain/PBR/Tiles083_1K_Color.png");
        tiles.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_3", tiles);
        matTerrain.setFloat("AlbedoMap_3_scale", tileRoadScale);
        matTerrain.setFloat("Roughness_3", 0.87f);
        matTerrain.setFloat("Metallic_3", 0.08f);

        // GRASS texture
        Texture grass = assetManager.loadTexture("Textures/Terrain/PBR/Ground037_1K_Color.png");
        grass.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_4", grass);
        matTerrain.setFloat("AlbedoMap_4_scale", grassScale);
        matTerrain.setFloat("Roughness_4", 1);
        matTerrain.setFloat("Metallic_4", 0);

        // MARBLE texture
        Texture marble = assetManager.loadTexture("Textures/Terrain/PBR/Marble013_1K_Color.png");
        marble.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_5", marble);
        matTerrain.setFloat("AlbedoMap_5_scale", marbleScale);
        matTerrain.setFloat("Roughness_5", 0.06f);
        matTerrain.setFloat("Metallic_5", 0.8f);

        // Gravel texture
        Texture gravel = assetManager.loadTexture("Textures/Terrain/PBR/Gravel015_1K_Color.png");
        gravel.setWrap(WrapMode.Repeat);
        matTerrain.setTexture("AlbedoMap_6", gravel);
        matTerrain.setFloat("AlbedoMap_6_scale", gravelScale);
        matTerrain.setFloat("Roughness_6", 0.9f);
        matTerrain.setFloat("Metallic_6", 0.07f);
        // NORMAL MAPS
        Texture normalMapDirt = assetManager.loadTexture("Textures/Terrain/PBR/Ground036_1K_Normal.png");
        normalMapDirt.setWrap(WrapMode.Repeat);
        
        Texture normalMapDarkRock = assetManager.loadTexture("Textures/Terrain/PBR/Rock035_1K_Normal.png");
        normalMapDarkRock.setWrap(WrapMode.Repeat);
        
        Texture normalMapSnow = assetManager.loadTexture("Textures/Terrain/PBR/Snow006_1K_Normal.png");
        normalMapSnow.setWrap(WrapMode.Repeat);
        
        Texture normalMapGravel = assetManager.loadTexture("Textures/Terrain/PBR/Gravel015_1K_Normal.png");
        normalMapGravel.setWrap(WrapMode.Repeat);
        
        Texture normalMapGrass = assetManager.loadTexture("Textures/Terrain/PBR/Ground037_1K_Normal.png");
        normalMapGrass.setWrap(WrapMode.Repeat);
        
        Texture normalMapMarble = assetManager.loadTexture("Textures/Terrain/PBR/Marble013_1K_Normal.png");
        normalMapGrass.setWrap(WrapMode.Repeat);
        
        Texture normalMapTiles = assetManager.loadTexture("Textures/Terrain/PBR/Tiles083_1K_Normal.png");
        normalMapTiles.setWrap(WrapMode.Repeat);        

        
        matTerrain.setTexture("NormalMap_0", normalMapDirt);
        matTerrain.setTexture("NormalMap_1", normalMapDarkRock);
        matTerrain.setTexture("NormalMap_2", normalMapSnow);
        matTerrain.setTexture("NormalMap_3", normalMapTiles);
        matTerrain.setTexture("NormalMap_4", normalMapGrass);
   //     matTerrain.setTexture("NormalMap_5", normalMapMarble);  //using this texture will surpass the 16 texture limit
        matTerrain.setTexture("NormalMap_6", normalMapGravel);
                
        terrain.setMaterial(matTerrain);
    }
    
    private void setupKeys() {
        flyCam.setMoveSpeed(50);
        inputManager.addMapping("spawnModel", new KeyTrigger(KeyInput.KEY_N));
        
        inputManager.addListener(actionListener, "spawnModel");   
        
        keybindingsText = new BitmapText(assetManager.loadFont("Interface/Fonts/Default.fnt"));
        keybindingsText.setText("Press 'N' to spawn a model with a DAC that will be luanched in ragdoll mode after 2 seconds ");
        
        getGuiNode().attachChild(keybindingsText);
        keybindingsText.move(new Vector3f(200,120,0));
        
    }
    
    @Override
    public void simpleUpdate(float tpf) {
        super.simpleUpdate(tpf);
        
        
        for(int i = 0; i < loadedElfCharacterNPCs.size(); i ++){
            ElfCharacter elfCharacter = loadedElfCharacterNPCs.get(i);
            elfCharacter.update(tpf);
            
            if(elfCharacter.despawnTime <= 0){
                this.despawnElfNpc(elfCharacter);
            }
               
        }

        
        if(elfCharacterToFollowWithCamera != null){
            
            Vector3f characterPos = elfCharacterToFollowWithCamera.characterSpatial.getWorldTranslation();
            

            
            
            Vector3f camPos = characterPos.subtract(camChaseDistance);
            
            cam.setLocation(camPos);
                    
            cam.lookAt(characterPos.add(0,2,0), Vector3f.UNIT_Y);
            
            followLaunchedCharacterTime -= tpf;
            
            if(followLaunchedCharacterTime <= 0){
                elfCharacterToFollowWithCamera = null;
            }
            
        }
    }

    private void setUpTerrain() {
        // HEIGHTMAP image (for the terrain heightmap)
        TextureKey hmKey = new TextureKey("Textures/Terrain/splat/mountains512.png", false);
        Texture heightMapImage = assetManager.loadTexture(hmKey);

        // CREATE HEIGHTMAP
        AbstractHeightMap heightmap = null;
        try {
            heightmap = new ImageBasedHeightMap(heightMapImage.getImage(), 0.3f);
            heightmap.load();
            heightmap.smooth(0.9f, 1);

        } catch (Exception e) {
            e.printStackTrace();
        }
        
        terrain = new TerrainQuad("terrain", patchSize + 1, terrainSize + 1, heightmap.getHeightMap());//, new LodPerspectiveCalculatorFactory(getCamera(), 4)); // add this in to see it use entropy for LOD calculations
        TerrainLodControl control = new TerrainLodControl(terrain, getCamera());
        control.setLodCalculator(new DistanceLodCalculator(patchSize + 1, 2.7f)); // patch size, and a multiplier
        terrain.addControl(control);
        terrain.setMaterial(matTerrain);
        terrain.setLocalTranslation(0, -100, 0);
        terrain.setLocalScale(1f, 1f, 1f);
        rootNode.attachChild(terrain);
        
        
        RigidBodyControl terrainRbc = new RigidBodyControl(0);
        terrain.addControl(terrainRbc);
        
        bulletAppState.getPhysicsSpace().add(terrainRbc);
    }

    private void setUpLights() {
        
        LightProbe probe = (LightProbe) assetManager.loadAsset("Scenes/LightProbes/quarry_Probe.j3o");
        
        probe.setAreaType(LightProbe.AreaType.Spherical);      
        probe.getArea().setRadius(2000);
        probe.getArea().setCenter(new Vector3f(0, 0, 0));        
        rootNode.addLight(probe);
        
        directionalLight = new DirectionalLight();
        directionalLight.setDirection((new Vector3f(-0.3f, -0.5f, -0.3f)).normalize());
        directionalLight.setColor(ColorRGBA.White);
        rootNode.addLight(directionalLight);
        
        ambientLight = new AmbientLight();
        directionalLight.setColor(ColorRGBA.White);
        rootNode.addLight(ambientLight);        
    }

    private void setUpCamera() {
        cam.setLocation(new Vector3f(0, 10, -10));
        cam.lookAtDirection(new Vector3f(0, -1.5f, -1).normalizeLocal(), Vector3f.UNIT_Y);
        
        getFlyByCamera().setMoveSpeed(camMoveSpeed);        
    }    
    
    

    
}


