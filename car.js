class Car{
    constructor(x,y,width,height,controlType,maxSpeed=3,color="blue"){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.speed=0;
        this.acceleration=0.2;
        this.maxSpeed=maxSpeed;
        this.friction=0.05;
        this.angle=0;
        this.damaged=false;
        this.distance = 0;
        this.offst = [0,0,0,0];
        this.flag = 0;
        this.min_epsilon = 0.05;
        this.max_epsilon = 1;
        this.decay_rate = 0.0005;
        this.epsilon;
        this.useBrain=controlType=="AI";
        if(controlType!="DUMMY"){
            this.sensor=new Sensor(this);
            this.brain = new Qlearning(5);
        }
        this.controls=new Controls(controlType);
        this.img=new Image();
        this.img.src="car.png"
        this.mask=document.createElement("canvas");
        this.mask.width=width;
        this.mask.height=height;
        const maskCtx=this.mask.getContext("2d");
        this.img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();
            maskCtx.globalCompositeOperation="destination-atop";
            maskCtx.drawImage(this.img,0,0,this.width,this.height);
        }
    }
    update(roadBorders,traffic,qtable){
        if(!this.damaged){
            if(this.useBrain){
                if(this.y/10>50){
                    this.flag = 1; 
                }
                //getting actions from epsilon_greedy
                this.epsilon = this.min_epsilon + (this.max_epsilon - this.min_epsilon)*Math.exp(-this.decay_rate*(-this.y/1000));
                const action = this.brain.epsilon_greedy(0.3,this.offst,qtable,this.flag);
                this.controls.forward=action[0];
                this.controls.left=action[1];
                this.controls.right=action[2];
                this.controls.reverse=action[3];
            }   
            this.move();
            this.polygon=this.createPolygon();
            this.damaged=this.assessDamage(roadBorders,traffic);
        }
        if(this.sensor){
            //it is basically new state;
            this.sensor.update(roadBorders,traffic);
            const offsets=this.sensor.readings.map(
                s=>s==null?0:1-s.offset
                
            );
            for(let i=0;i<offsets.length;i++){
                if(offsets[i]>=0&&offsets[i]<1/4){
                    offsets[i] = 0;
                    this.offst[i] = offsets[i];
                }
                if(offsets[i]>=1/4&&offsets[i]<2/4){
                    offsets[i]=1;
                    this.offst[i] = offsets[i];
                }
                if(offsets[i]>=2/4&&offsets[i]<3/4){
                    offsets[i]=2;
                    this.offst[i] = offsets[i];
                }
                if(offsets[i]>=3/4&&offsets[i]<4/4){
                    offsets[i]=3;
                    this.offst[i] = offsets[i];
                }
            } 
            //imporve reward function;
            const reward = this.brain.qReward(this,roadBorders,traffic,-this.y/10,this.controls.forward,this.controls.reverse,this.controls.left,this.controls.right,this.flag,this.offst);
            //need to update Q-table
            const nowaction = [];
            for(let i=0;i<4;i++){
                nowaction.push(0);
            }
                if(this.controls.forward!=0){
                    nowaction[0]=1;
                }
                if(this.controls.left!=0){
                    nowaction[1]=1;
                }
                if(this.controls.right!=0){
                    nowaction[2]=1;
                }
                if(this.controls.reverse!=0){
                    nowaction[3]=1;
                }
                var maxvalue = 0;
         
                for(let i=0;i<this.sensor.rayCount;i++){
                    for(let j=0;j<4;j++){
                        for(let k=0;k<4;k++){
                           
                            if(qtable[i][j][k]>=maxvalue){
                               
                                maxvalue = qtable[i][j][k];
                            }
                        }
                    }
                }
                for(let i=0;i<this.sensor.rayCount;i++){
                    for(let j = 0;j<4;j++){
                        if(nowaction[j]!=0){
                            qtable[i][offsets[i]][j] = qtable[i][offsets[i]][j] + 0.7*(reward+0.95*maxvalue-qtable[i][offsets[i]][j]);   
                        }
            
                    }
                }
                
    

           
        }
    }

    assessDamage(roadBorders,traffic){
        for(let i=0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        for(let i=0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }

    createPolygon(){
        const points=[];
        const rad=Math.hypot(this.width,this.height)/2;
        const alpha=Math.atan2(this.width,this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }


    move(){
        if(this.controls.forward){
            this.speed+=this.acceleration;
        }
        if(this.controls.reverse){
            this.speed-=this.acceleration;
        }

        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed/2){
            this.speed=-this.maxSpeed/2;
        }

        if(this.speed>0){
            this.speed-=this.friction;
        }
        if(this.speed<0){
            this.speed+=this.friction;
        }
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        if(this.speed!=0){
            const flip=this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+=0.03*flip;
            }
            if(this.controls.right){
                this.angle-=0.03*flip;
            }
        }

        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
       
       
           /*///measuring car distance for Q-learning algo
           if(this.controls.forward&&this.controls.reverse){
            this.distance = this.distance+0;
            
        }else if(this.controls.right&&this.controls.left){
            if(this.controls.forward&&this.controls.left){
                this.distance =  this.distance + Math.cos(this.angle);
            }
            else if(this.controls.forward&&this.controls.right){
                this.distance = this.distance + Math.sin(this.angle);
            }
            
        }else if(this.controls.forward){
            this.distance = this.distance+1;
        }*/
        
    }
    

    draw(ctx,drawSensor=false){
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            ctx.globalCompositeOperation="multiply";
        }
        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);
        ctx.restore();

    }
}