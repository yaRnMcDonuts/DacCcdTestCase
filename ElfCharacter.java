/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mygame;

import com.jme3.anim.AnimComposer;
import com.jme3.anim.ArmatureMask;
import com.jme3.anim.SkinningControl;
import com.jme3.anim.tween.Tween;
import com.jme3.anim.tween.Tweens;
import com.jme3.anim.tween.action.Action;
import com.jme3.app.SimpleApplication;
import com.jme3.bullet.BulletAppState;
import com.jme3.bullet.animation.CenterHeuristic;
import com.jme3.bullet.animation.DynamicAnimControl;
import com.jme3.bullet.animation.LinkConfig;
import com.jme3.bullet.animation.MassHeuristic;
import com.jme3.bullet.animation.RangeOfMotion;
import com.jme3.bullet.animation.ShapeHeuristic;
import com.jme3.bullet.collision.shapes.ConvexShape;
import com.jme3.bullet.objects.PhysicsRigidBody;
import com.jme3.math.Vector3f;
import com.jme3.scene.Spatial;

/**
 *
 * @author ryan
 */
public class ElfCharacter {
    

    
    public Spatial characterSpatial;
    public SimpleApplication app;
    
    public AnimComposer animComposer;
    public SkinningControl skinningControl;
    
    public ArmatureMask lowerBodyMask, upperBodyMask;

    public DynamicAnimControl dynamicAnimControl;
    
    public final Vector3f launchForce;
    
    public ElfCharacter(SimpleApplication app, Vector3f spawnLoc) {
        this.app = app;
        
        characterSpatial = app.getAssetManager().loadModel("Models/baseFemaleSpatial_0.j3o");
        

        app.getRootNode().attachChild(characterSpatial);
        
        characterSpatial.setLocalTranslation(spawnLoc);
        
        
        animComposer = characterSpatial.getControl(AnimComposer.class);  
        skinningControl = characterSpatial.getControl(SkinningControl.class);  
        
        
        animComposer.setCurrentAction("ladyWalk");
        
        
        dynamicAnimControl = new WControl();
        characterSpatial.addControl(dynamicAnimControl);
        
        BulletAppState bulletAppState = app.getStateManager().getState(BulletAppState.class);
        dynamicAnimControl.setPhysicsSpace(bulletAppState.getPhysicsSpace());
        
        
        launchForce = characterSpatial.getWorldTranslation().subtract(app.getCamera().getLocation());
        launchForce.normalizeLocal();
        launchForce.multLocal(250);
        
        
        if(Main.USE_CCD){

            for (PhysicsRigidBody rigidBody : dynamicAnimControl.listRigidBodies()) {

                ConvexShape shape = (ConvexShape) rigidBody.getCollisionShape();
                float radius = shape.maxRadius();
                rigidBody.setCcdMotionThreshold(radius/3);
                rigidBody.setCcdSweptSphereRadius(radius);
                
            }

        }


        
    }
    
    public float despawnTime = 25f;
    private float ragdollDelayTime = 3f;    
    private float launchDelayTime = 2f;
    
    
    private boolean isLaunched = false;
    private boolean isInRagDollMode = false;
    
    
    
    public void update(float tpf){
        

        if(launchDelayTime <= 0){ //wait a short time to launch model after it is spawned               
            if(!isLaunched){                               
                dynamicAnimControl.setDynamicSubtree(dynamicAnimControl.getTorsoLink(), launchForce, false);                
                isLaunched = true;
            }             
        }else{
            launchDelayTime -= tpf;
        }
        
        
        //set the model into ragdoll mode shortly after being launched
        if(ragdollDelayTime <= 0){
            if(!isInRagDollMode){
                isInRagDollMode = true;
                dynamicAnimControl.setRagdollMode();
            }
        }else{
            ragdollDelayTime -= tpf;
            
            
        }
        
        
        despawnTime -= tpf;
        if(despawnTime <= 0){
            
            BulletAppState bulletAppState = app.getStateManager().getState(BulletAppState.class);
            bulletAppState.getPhysicsSpace().remove(dynamicAnimControl);
            characterSpatial.removeControl(dynamicAnimControl);
            app.getRootNode().detachChild(characterSpatial);
        }
        
    }

    
    public class WControl extends DynamicAnimControl {

        public WControl() {
            super();
            LinkConfig config1 = new LinkConfig(1f, MassHeuristic.Density,
                    ShapeHeuristic.VertexHull, new Vector3f(1f, 1f, 1f),
                    CenterHeuristic.Mean);
            super.setConfig("", config1);
            super.link("thigh_l", config1,
                    new RangeOfMotion(2.54f, -2.62f, 0.58f, -1.04f, 1.14f, -0.76f));
            super.link("upperarm_r", config1,
                    new RangeOfMotion(0.59f, -2.22f, 0.82f, -0.98f, 0.51f, -1.59f));
            super.link("foot_l", config1,
                    new RangeOfMotion(0.4f, -1.04f, 0.24f, -0.35f, 0.22f, -0.41f));
            super.link("upperarm_l", config1,
                    new RangeOfMotion(0.47f, -1.85f, 1.14f, -0.7f, 1.77f, -0.57f));
            super.link("thigh_r", config1,
                    new RangeOfMotion(3.1f, -2.33f, 0.83f, -0.58f, 0.48f, -1.15f));
            super.link("neck_01", config1,
                    new RangeOfMotion(0.91f, -1.29f, 0.41f, -0.35f, 0.41f, -0.26f));
            super.link("clavicle_r", config1,
                    new RangeOfMotion(0.36f, -1.91f, 0.49f, -1.07f, 0.31f, -1.63f));
            super.link("calf_r", config1,
                    new RangeOfMotion(0.21f, -2.37f, 0.34f, -0.9f, 0.49f, -0.4f));
            super.link("lowerarm_r", config1,
                    new RangeOfMotion(0.02f, -2f, 1.3f, -1.28f, 0.94f, -1.97f));
            super.link("spine_02", config1,
                    new RangeOfMotion(2.53f, -2.09f, 0.61f, -0.61f, 0.29f, -0.13f));
            super.link("lowerarm_l", config1,
                    new RangeOfMotion(0.1f, -1.98f, 0.81f, -0.53f, 1.27f, -0.55f));
            super.link("clavicle_l", config1,
                    new RangeOfMotion(0.84f, -1.12f, 1.28f, -0.5f, 0.63f, -1.3f));
            super.link("calf_l", config1,
                    new RangeOfMotion(0.25f, -2.38f, 0.91f, -1.16f, 0.45f, -0.27f));
            super.link("hand_l", config1,
                    new RangeOfMotion(1.26f, -0.81f, 1.35f, -0.44f, 0.78f, -0.99f));
            super.link("foot_r", config1,
                    new RangeOfMotion(0.3f, -1.03f, 0.27f, -0.16f, 0.41f, -0.18f));
            
            super.setMainBoneName("pelvis");
            
        }
    }
    
    
    
    
}
