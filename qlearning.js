class Qlearning{
    constructor(rayCount){
        this.dis= 0;
    }  
        populate_qtable(rayCount,offsetcount,qtable){
            //sensors
            for(let k=0;k<rayCount;k++){                    
                    const temj = [];
                     //offsets
                for(let i=0;i<offsetcount;i++){
                    const temi = [];
                           //reward
                    for(let j=0;j<4;j++){
                            temi.push(0);
                    
                    }
                    temj.push(temi);
                }
                qtable.push(temj);
            }
        }
        epsilon_greedy(epsilon,state,qtable){
            const random_number= Math.random(0,1);
            
            const actions = [];
            if(random_number>=epsilon){
               
                const sensor= 0;
                const offset = 0;
                var action = 0;
                var maxvalue = 0;

                for(let i=0;i<state.length;i++){
                   for(let j=0;j<4;j++){
                    if(qtable[i][state[i]][j]>=maxvalue){
                      
                        maxvalue = qtable[i][state[i]][j];
                       
                        
                        action = j;
                    }
                   }
                }
                
                for(let i=0;i<4;i++){
                    if(i==action){
                        actions.push(1);
                    }else{actions.push(0);}
                   
                }
            }
            else{
                for(let i=0;i<4;i++){
                    const ran = Math.random(0,1);
                    if(ran>=0.5){
                           actions.push(1); 
                    }else{
                        actions.push(0);
                    }
                }
               
            }
            return actions;
        }
        
        qReward(car,roadborder,traffic,distance,forward,reverse,left,right,flag,offset){
            var reward = 0;
            if(car.assessDamage(roadborder,traffic)){
                return -1000;
            }
                if(forward!=0 && reverse!=0){
                    return -1;
                }
                if(left!=0 && right!=0){
                    return -1;
                }
                    //always make sure farward is active most of the time. is it good stratergy?   
                    if(this.dis<distance){
                        this.dis = distance;
                        reward=reward+1;}
                         
                                     
                      for(let i=0;i<offset.length;i++){
                        
                        if(offset[i]==1){
                                reward = reward-1;
                        }
                        if(offset[i]==2){
                            reward = reward-2;
                        }
                        if(offset[i]==3){
                            reward = reward-3;
                         }
                        }
                        return reward;          
        }
       


}