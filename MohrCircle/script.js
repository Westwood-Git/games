// 获取DOM元素
const sigmaXInput = document.getElementById('sigmaX');
const sigmaYInput = document.getElementById('sigmaY');
const tauXYInput = document.getElementById('tauXY');
const angleInput = document.getElementById('angleInput');
const angleValue = document.getElementById('angleValue');
const angleSlider = document.getElementById('angleSlider');
const decreaseAngleBtn = document.getElementById('decreaseAngle');
const increaseAngleBtn = document.getElementById('increaseAngle');

const sigmaThetaEl = document.getElementById('sigmaTheta');
const tauThetaEl = document.getElementById('tauTheta');
const sigmaMaxEl = document.getElementById('sigmaMax');
const sigmaMinEl = document.getElementById('sigmaMin');
const tauMaxEl = document.getElementById('tauMax');
const thetaPEl = document.getElementById('thetaP');

const presetButtons = document.querySelectorAll('.preset-btn');




// 计算步骤元素
const step1El = document.getElementById('step1');
const step2El = document.getElementById('step2');
const step3El = document.getElementById('step3');
const step4El = document.getElementById('step4');
const step5El = document.getElementById('step5');

const stressCanvas = document.getElementById('stressCanvas');
const stressCtx = stressCanvas.getContext('2d');

const mohrCanvas = document.getElementById('mohrCircleCanvas');
const mohrCtx = mohrCanvas.getContext('2d');

// 初始值
let sigmaX = parseFloat(sigmaXInput.value);
let sigmaY = parseFloat(sigmaYInput.value);
let tauXY = parseFloat(tauXYInput.value);
let theta = parseFloat(angleInput.value);

// 修复小数点输入问题
function parseAngleInput(value) {
    // 直接解析浮点数，不进行四舍五入
    return parseFloat(value) || 0;
}





// 更新角度显示 - 修复版
function updateAngle(value) {
    // 解析输入值
    const parsedValue = parseAngleInput(value);
    
    // 更新角度值
    theta = parsedValue;
    
    // 更新显示，保留一位小数
    angleValue.textContent = theta.toFixed(1);
    angleInput.value = theta;
    
    // 同步滑块：将角度转换到-180到180度范围用于滑块
    let sliderAngle = ((theta % 360) + 360) % 360;
    if (sliderAngle > 180) {
        sliderAngle = sliderAngle - 360;
    }
    angleSlider.value = sliderAngle;
     // 更新预设按钮状态
    updatePresetButtonState();
    
    calculateAndDraw();
}

// 角度输入框事件
angleInput.addEventListener('input', (e) => {
    updateAngle(e.target.value);
});

// 角度滑块事件
angleSlider.addEventListener('input', (e) => {
    // 滑块控制在-180到180度
    const sliderAngle = parseFloat(e.target.value);
    theta = sliderAngle;
    
    // 更新输入框和显示
    angleValue.textContent = theta.toFixed(1);
    angleInput.value = theta;
    
    calculateAndDraw();
});

// 角度按钮事件
decreaseAngleBtn.addEventListener('click', () => {
    theta -= 5;
    updateAngle(theta);
});

increaseAngleBtn.addEventListener('click', () => {
    theta += 5;
    updateAngle(theta);
});

// 应力输入框事件
[sigmaXInput, sigmaYInput, tauXYInput].forEach(input => {
    input.addEventListener('input', () => {
        sigmaX = parseFloat(sigmaXInput.value) || 0;
        sigmaY = parseFloat(sigmaYInput.value) || 0;
        tauXY = parseFloat(tauXYInput.value) || 0;
        calculateAndDraw();
    });
});


// 更新预设按钮状态
function updatePresetButtonState() {
    presetButtons.forEach(button => {
        const buttonAngle = parseFloat(button.getAttribute('data-angle'));
        // 如果当前角度等于按钮角度（考虑360度周期）
        if (Math.abs((theta % 360) - (buttonAngle % 360)) < 0.1 ||
            Math.abs((theta % 360) - (buttonAngle % 360) - 360) < 0.1 ||
            Math.abs((theta % 360) - (buttonAngle % 360) + 360) < 0.1) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// 预设按钮点击事件
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const angle = parseFloat(button.getAttribute('data-angle'));
        updateAngle(angle);
        
        // 移除所有按钮的active类
        presetButtons.forEach(btn => btn.classList.remove('active'));
        // 为当前按钮添加active类
        button.classList.add('active');
    });
});

// 计算应力
function calculateStress(sigmaX, sigmaY, tauXY, theta) {
    // 转换为弧度用于计算
    const thetaRad = theta * Math.PI / 180;
    const cos2Theta = Math.cos(2 * thetaRad);
    const sin2Theta = Math.sin(2 * thetaRad);
    
    // σθ = (σₓ + σᵧ)/2 + (σₓ - σᵧ)/2 · cos2θ - τₓᵧ · sin2θ
    const sigmaTheta = (sigmaX + sigmaY) / 2 + 
                      (sigmaX - sigmaY) / 2 * cos2Theta - 
                      tauXY * sin2Theta; 
    
    // τθ = (σₓ - σᵧ)/2 · sin2θ + τₓᵧ · cos2θ
    const tauTheta = (sigmaX - sigmaY) / 2 * sin2Theta + 
                    tauXY * cos2Theta; 
    
    // 计算主应力
    const avg = (sigmaX + sigmaY) / 2;
    const R = Math.sqrt(((sigmaX - sigmaY) / 2) ** 2 + tauXY ** 2);
    const sigmaMax = avg + R;
    const sigmaMin = avg - R;
    
    // 最大切应力
    const tauMax = R;
    
    // 计算主方向角（单位：度）
    let thetaP = 0;
    if (Math.abs(sigmaX - sigmaY) > 1e-6 || Math.abs(tauXY) > 1e-6) {
        thetaP = 0.5 * Math.atan2(-2 * tauXY, sigmaX - sigmaY) * 180 / Math.PI;
    }
    
    return { 
        sigmaTheta, 
        tauTheta, 
        sigmaMax, 
        sigmaMin, 
        avg, 
        R, 
        tauMax, 
        thetaP
    };
}

// 绘制单元体和斜截面
function drawElement(sigmaX, sigmaY, tauXY, theta, sigmaTheta, tauTheta) {
    const width = stressCanvas.width;
    const height = stressCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const elementSize = 160;
    const rotatedElementSize = 100;
    
    // 清除画布
    stressCtx.clearRect(0, 0, width, height);
    
    // 绘制坐标系
    stressCtx.beginPath();
    stressCtx.moveTo(centerX - 200, centerY);
    stressCtx.lineTo(centerX + 200, centerY);
    stressCtx.moveTo(centerX, centerY - 200);
    stressCtx.lineTo(centerX, centerY + 200);
    stressCtx.strokeStyle = '#f0f0f0';
    stressCtx.lineWidth = 1;
    stressCtx.stroke();
    
    // 绘制坐标轴标签
    stressCtx.font = '14px Arial';
    stressCtx.fillStyle = '#aaa';
    stressCtx.fillText('x', centerX + 190, centerY - 10);
    stressCtx.fillText('y', centerX + 10, centerY - 190);
    
    // 绘制主单元体
    stressCtx.beginPath();
    stressCtx.rect(centerX - elementSize/2, centerY - elementSize/2, elementSize, elementSize);
    stressCtx.strokeStyle = '#2c3e50';
    stressCtx.lineWidth = 1.2;
    stressCtx.stroke();
    
    // 绘制主单元体上的应力
    drawStressesOnMainElement(centerX, centerY, elementSize, sigmaX, sigmaY, tauXY);
    
    // 绘制旋转单元体（紫色小方块）
    const thetaPlot = -theta; // Canvas中角度顺时针为正
    drawRotatedElement(centerX, centerY, rotatedElementSize, thetaPlot, sigmaTheta, tauTheta);
}

// 绘制主单元体上的应力
function drawStressesOnMainElement(centerX, centerY, size, sigmaX, sigmaY, tauXY) {
    const baseArrowLength = 30;
    const minArrowLength = 20;
    const arrowOffset = 25;
    const stressScale = 0.6;
    
    // 绘制σx (X方向正应力，红色)
    if (sigmaX !== 0) {
        const xStressColor = '#e74c3c';
        const xStressArrowLength = Math.max(Math.abs(sigmaX) * stressScale, minArrowLength);
        
        // 右侧面
        stressCtx.beginPath();
        if (sigmaX > 0) {
            // 拉应力为正，箭头向右（背离单元体）
            drawArrow(stressCtx, 
                centerX + size/2 + arrowOffset, 
                centerY, 
                centerX + size/2 + arrowOffset + xStressArrowLength, 
                centerY, 
                xStressColor, 2.5);
        } else {
            // 压应力为负，箭头向左（指向单元体）
            drawArrow(stressCtx, 
                centerX + size/2 + arrowOffset + xStressArrowLength, 
                centerY, 
                centerX + size/2 + arrowOffset, 
                centerY, 
                xStressColor, 2.5);
        }
        
        // 左侧面
        stressCtx.beginPath();
        if (sigmaX > 0) {
            drawArrow(stressCtx, 
                centerX - size/2 - arrowOffset, 
                centerY, 
                centerX - size/2 - arrowOffset - xStressArrowLength, 
                centerY, 
                xStressColor, 2.5);
        } else {
            drawArrow(stressCtx, 
                centerX - size/2 - arrowOffset - xStressArrowLength, 
                centerY, 
                centerX - size/2 - arrowOffset, 
                centerY, 
                xStressColor, 2.5);
        }
    }
    
    // 绘制σy (Y方向正应力，绿色)
    if (sigmaY !== 0) {
        const yStressColor = '#2ecc71';
        const yStressArrowLength = Math.max(Math.abs(sigmaY) * stressScale, minArrowLength);
        
        // 上侧面
        stressCtx.beginPath();
        if (sigmaY > 0) {
            drawArrow(stressCtx, 
                centerX, 
                centerY - size/2 - arrowOffset, 
                centerX, 
                centerY - size/2 - arrowOffset - yStressArrowLength, 
                yStressColor, 2.5);
        } else {
            drawArrow(stressCtx, 
                centerX, 
                centerY - size/2 - arrowOffset - yStressArrowLength, 
                centerX, 
                centerY - size/2 - arrowOffset, 
                yStressColor, 2.5);
        }
        
        // 下侧面
        stressCtx.beginPath();
        if (sigmaY > 0) {
            drawArrow(stressCtx, 
                centerX, 
                centerY + size/2 + arrowOffset, 
                centerX, 
                centerY + size/2 + arrowOffset + yStressArrowLength, 
                yStressColor, 2.5);
        } else {
            drawArrow(stressCtx, 
                centerX, 
                centerY + size/2 + arrowOffset + yStressArrowLength, 
                centerX, 
                centerY + size/2 + arrowOffset, 
                yStressColor, 2.5);
        }
    }
    
    // 绘制τxy (切应力，蓝色)
    if (tauXY !== 0) {
        const tauColor = '#3498db';
        const tauArrowLength = Math.max(Math.abs(tauXY) * stressScale, minArrowLength);
        
        if (tauXY > 0) {
            // τxy为正：使单元体顺时针转
            // 右侧面：向下
            drawArrow(stressCtx, 
                centerX + size/2 + arrowOffset, 
                centerY - tauArrowLength/2, 
                centerX + size/2 + arrowOffset, 
                centerY + tauArrowLength, 
                tauColor, 2.5);
            
            // 左侧面：向上
            drawArrow(stressCtx, 
                centerX - size/2 - arrowOffset, 
                centerY + tauArrowLength/2, 
                centerX - size/2 - arrowOffset, 
                centerY - tauArrowLength, 
                tauColor, 2.5);
            
            // 上侧面：向左
            drawArrow(stressCtx, 
                centerX + tauArrowLength/2, 
                centerY - size/2 - arrowOffset, 
                centerX - tauArrowLength, 
                centerY - size/2 - arrowOffset, 
                tauColor, 2.5);
            
            // 下侧面：向右
            drawArrow(stressCtx, 
                centerX - tauArrowLength/2, 
                centerY + size/2 + arrowOffset, 
                centerX + tauArrowLength, 
                centerY + size/2 + arrowOffset, 
                tauColor, 2.5);
        } else {
            // τxy为负：使单元体逆时针转
            // 右侧面：向上
            drawArrow(stressCtx, 
                centerX + size/2 + arrowOffset, 
                centerY + tauArrowLength/2, 
                centerX + size/2 + arrowOffset, 
                centerY - tauArrowLength, 
                tauColor, 2.5);
            
            // 左侧面：向下
            drawArrow(stressCtx, 
                centerX - size/2 - arrowOffset, 
                centerY - tauArrowLength/2, 
                centerX - size/2 - arrowOffset, 
                centerY + tauArrowLength, 
                tauColor, 2.5);
            
            // 上侧面：向右
            drawArrow(stressCtx, 
                centerX - tauArrowLength/2, 
                centerY - size/2 - arrowOffset, 
                centerX + tauArrowLength, 
                centerY - size/2 - arrowOffset, 
                tauColor, 2.5);
            
            // 下侧面：向左
            drawArrow(stressCtx, 
                centerX + tauArrowLength/2, 
                centerY + size/2 + arrowOffset, 
                centerX - tauArrowLength, 
                centerY + size/2 + arrowOffset, 
                tauColor, 2.5);
        }
    }
}

// 绘制旋转单元体及其上的应力
function drawRotatedElement(centerX, centerY, size, thetaPlot, sigmaTheta, tauTheta) {
    const thetaRad = thetaPlot * Math.PI / 180;
    
    stressCtx.save();
    stressCtx.translate(centerX, centerY);
    stressCtx.rotate(thetaRad);
    
    // 绘制旋转后的单元体（紫色小方块）
    stressCtx.beginPath();
    stressCtx.rect(-size/2, -size/2, size, size);
    
    const gradient = stressCtx.createLinearGradient(-size/2, -size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(155, 89, 182, 0.1)');
    gradient.addColorStop(1, 'rgba(155, 89, 182, 0.05)');
    stressCtx.fillStyle = gradient;
    stressCtx.fill();
    
    stressCtx.strokeStyle = '#9b59b6';
    stressCtx.lineWidth = 2.2;
    stressCtx.stroke();
    
    // 绘制旋转单元体上的应力（紫色箭头）
    drawStressesOnRotatedElement(0, 0, size, sigmaTheta, tauTheta);
    
    stressCtx.restore();
}

// 绘制旋转单元体上的应力
function drawStressesOnRotatedElement(x, y, size, sigmaTheta, tauTheta) {
    const stressColor = '#9b59b6';
    const minArrowLength = 15;
    const offset = 15;
    const stressScale = 0.6;
    
    // 绘制正应力σθ
    if (sigmaTheta !== 0) {
        const sigmaArrowLength = Math.max(Math.abs(sigmaTheta) * stressScale, minArrowLength);
        const isTensile = sigmaTheta > 0;
        
        stressCtx.beginPath();
        if (isTensile) {
            drawArrow(stressCtx, 
                x + size/2 + offset, 
                y, 
                x + size/2 + offset + sigmaArrowLength, 
                y, 
                stressColor, 3.0);
        } else {
            drawArrow(stressCtx, 
                x + size/2 + offset + sigmaArrowLength, 
                y, 
                x + size/2 + offset, 
                y, 
                stressColor, 3.0);
        }
    }
    
    // 绘制切应力τθ
    if (Math.abs(tauTheta) > 1e-2)  {
    //if (tauTheta !== 0) {
        const tauArrowLength = Math.max(Math.abs(tauTheta) * stressScale, minArrowLength);
        
        stressCtx.beginPath();
        if (tauTheta > 0) {
            drawArrow(stressCtx, 
                x + size/2 + offset, 
                y - tauArrowLength/2, 
                x + size/2 + offset, 
                y + tauArrowLength, 
                stressColor, 3.0);
        } else {
            drawArrow(stressCtx, 
                x + size/2 + offset, 
                y + tauArrowLength/2, 
                x + size/2 + offset, 
                y - tauArrowLength, 
                stressColor, 3.0);
        }
    }
}

// 绘制莫尔应力圆
function drawMohrCircle(sigmaX, sigmaY, tauXY, theta, sigmaTheta, tauTheta, sigmaMax, sigmaMin, avg, R) {
    const width = mohrCanvas.width;
    const height = mohrCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    mohrCtx.clearRect(0, 0, width, height);
    
    // 计算所有需要显示的点
    const points = [sigmaMax, sigmaMin, sigmaX, sigmaY, sigmaTheta, avg - R, avg + R];
    const tauPoints = [tauXY, tauTheta, R, -R, 0];
    
    // 计算坐标轴范围
    const minSigma = Math.min(...points);
    const maxSigma = Math.max(...points);
    const maxTau = Math.max(...tauPoints.map(Math.abs));
    
    // 确定显示范围
    const sigmaRange = maxSigma - minSigma;
    const sigmaMargin = Math.max(sigmaRange * 0.4, R * 0.6);
    const displayMinSigma = minSigma - sigmaMargin;
    const displayMaxSigma = maxSigma + sigmaMargin * 0.5;
    
    const tauMargin = Math.max(maxTau * 0.4, R * 0.6);
    const displayMinTau = -maxTau - tauMargin;
    const displayMaxTau = maxTau + tauMargin;
    
    // 计算中心点
    const sigmaOffset = (displayMaxSigma + displayMinSigma) / 2;
    
    // 计算缩放比例
    const sigmaDisplayRange = displayMaxSigma - displayMinSigma;
    const tauDisplayRange = displayMaxTau - displayMinTau;
    const displayRange = Math.max(sigmaDisplayRange, tauDisplayRange);
    
    const displaySize = 200;
    const pixelPerUnit = displaySize / (displayRange / 2);
    
    // 计算σ=0在画布上的x坐标
    const zeroSigmaX = centerX + (0 - sigmaOffset) * pixelPerUnit;
    
    // 绘制坐标系
    mohrCtx.beginPath();
    // σ轴
    mohrCtx.moveTo(centerX - 210, centerY);
    mohrCtx.lineTo(centerX + 210, centerY);
    // τ轴
    mohrCtx.moveTo(zeroSigmaX, centerY - 210);
    mohrCtx.lineTo(zeroSigmaX, centerY + 210);
    mohrCtx.strokeStyle = '#ddd';
    mohrCtx.lineWidth = 1;
    mohrCtx.stroke();
    
    // 绘制坐标轴标签
    mohrCtx.font = 'bold 14px Arial';
    mohrCtx.fillStyle = '#666';
    mohrCtx.fillText('σ (MPa)', centerX + 170, centerY - 8);
    mohrCtx.fillText('τ (MPa)', zeroSigmaX + 15, centerY - 180);
    
    // 绘制网格线和坐标标注
    const gridStep = calculateGridStep(displayRange);
    
    // 绘制σ轴网格
    const startSigma = Math.ceil(displayMinSigma / gridStep) * gridStep;
    const endSigma = Math.floor(displayMaxSigma / gridStep) * gridStep;
    
    for (let sigma = startSigma; sigma <= endSigma; sigma += gridStep) {
        const xPos = centerX + (sigma - sigmaOffset) * pixelPerUnit;
        
        mohrCtx.beginPath();
        mohrCtx.moveTo(xPos, centerY - 210);
        mohrCtx.lineTo(xPos, centerY + 210);
        mohrCtx.strokeStyle = '#eee';
        mohrCtx.lineWidth = 0.5;
        mohrCtx.stroke();
        
        if (sigma % 20 === 0 && sigma !== 0) {
            const textX = Math.max(5, Math.min(width - 25, xPos - 8));
            mohrCtx.fillText(sigma.toFixed(0), textX, centerY + 18);
        }
    }
    
    // 绘制τ轴网格
    const startTau = Math.ceil(displayMinTau / gridStep) * gridStep;
    const endTau = Math.floor(displayMaxTau / gridStep) * gridStep;
    
    for (let tau = startTau; tau <= endTau; tau += gridStep) {
        if (Math.abs(tau) < 0.1) continue;
        
        const yPos = centerY - tau * pixelPerUnit;
        
        mohrCtx.beginPath();
        mohrCtx.moveTo(centerX - 210, yPos);
        mohrCtx.lineTo(centerX + 210, yPos);
        mohrCtx.strokeStyle = '#eee';
        mohrCtx.lineWidth = 0.5;
        mohrCtx.stroke();
        
        if (tau % 20 === 0 && tau !== 0) {
            const textY = Math.max(15, Math.min(height - 5, yPos + 18));
            mohrCtx.fillText(tau.toFixed(0), zeroSigmaX + 8, textY);
        }
    }
    
    // 标注原点"0"
    const originX = Math.max(5, Math.min(width - 15, zeroSigmaX - 12));
    mohrCtx.fillText('0', originX + 18, centerY + 18);
    
    // 计算圆心和半径
    const circleCenterX = centerX + (avg - sigmaOffset) * pixelPerUnit;
    const circleCenterY = centerY;
    const circleRadius = R * pixelPerUnit;
    
    // 绘制应力圆
    mohrCtx.beginPath();
    mohrCtx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
    mohrCtx.strokeStyle = '#4a6491';
    mohrCtx.lineWidth = 2.2;
    mohrCtx.stroke();
    
    // 绘制圆心
    mohrCtx.beginPath();
    mohrCtx.arc(circleCenterX, circleCenterY, 4, 0, Math.PI * 2);
    mohrCtx.fillStyle = '#4a6491';
    mohrCtx.fill();
    
    // 标注圆心坐标和半径
    mohrCtx.font = 'bold 14px Arial';
    mohrCtx.fillStyle = '#4a6491';
    mohrCtx.fillText(`圆心: C(${avg.toFixed(1)}, 0)`, 15, 30);
    mohrCtx.fillText(`半径: R = ${R.toFixed(1)}`, 15, 55);
    
    // 绘制Dx点(σx, τxy)
    const pointDxX = centerX + (sigmaX - sigmaOffset) * pixelPerUnit;
    const pointDxY = centerY + (-tauXY) * pixelPerUnit;
    
    mohrCtx.beginPath();
    mohrCtx.arc(pointDxX, pointDxY, 6, 0, Math.PI * 2);
    mohrCtx.fillStyle = '#e74c3c';
    mohrCtx.fill();
    mohrCtx.font = '13px Arial';
    mohrCtx.fillStyle = '#e74c3c';
    const dxLabelX = Math.max(5, Math.min(width - 30, pointDxX - 12));
    const dxLabelY = Math.max(20, Math.min(height - 5, pointDxY - 18));
    mohrCtx.fillText(`Dx(${sigmaX.toFixed(1)}, ${tauXY.toFixed(1)})`, dxLabelX, dxLabelY);
    
    // 绘制Dy点(σy, -τxy)
    const pointDyX = centerX + (sigmaY - sigmaOffset) * pixelPerUnit;
    const pointDyY = centerY + tauXY * pixelPerUnit;
    
    mohrCtx.beginPath();
    mohrCtx.arc(pointDyX, pointDyY, 6, 0, Math.PI * 2);
    mohrCtx.fillStyle = '#2ecc71';
    mohrCtx.fill();
    mohrCtx.fillStyle = '#2ecc71';
    const dyLabelX = Math.max(5, Math.min(width - 30, pointDyX - 12));
    const dyLabelY = Math.max(20, Math.min(height - 5, pointDyY + 22));
    mohrCtx.fillText(`Dy(${sigmaY.toFixed(1)}, ${(-tauXY).toFixed(1)})`, dyLabelX, dyLabelY);
    
    // 绘制当前截面应力点 (σθ, τθ)
    const pointDX = centerX + (sigmaTheta - sigmaOffset) * pixelPerUnit;
    const pointDY = centerY - tauTheta * pixelPerUnit;
    
    mohrCtx.beginPath();
    mohrCtx.arc(pointDX, pointDY, 7, 0, Math.PI * 2);
    mohrCtx.fillStyle = '#9b59b6';
    mohrCtx.fill();
    mohrCtx.font = 'bold 14px Arial';
    mohrCtx.fillStyle = '#9b59b6';
    const dLabelX = Math.max(5, Math.min(width - 55, pointDX - 28));
    const dLabelY = Math.max(20, Math.min(height - 5, pointDY - 18));
    mohrCtx.fillText(`D(${sigmaTheta.toFixed(1)}, ${tauTheta.toFixed(1)})`, dLabelX, dLabelY);
    
    // 连接圆心到各点
    mohrCtx.beginPath();
    mohrCtx.moveTo(circleCenterX, circleCenterY);
    mohrCtx.lineTo(pointDxX, pointDxY);
    mohrCtx.strokeStyle = '#e74c3c';
    mohrCtx.lineWidth = 1.5;
    mohrCtx.setLineDash([5, 3]);
    mohrCtx.stroke();
    
    mohrCtx.beginPath();
    mohrCtx.moveTo(circleCenterX, circleCenterY);
    mohrCtx.lineTo(pointDyX, pointDyY);
    mohrCtx.strokeStyle = '#2ecc71';
    mohrCtx.lineWidth = 1.5;
    mohrCtx.stroke();
    
    mohrCtx.beginPath();
    mohrCtx.moveTo(circleCenterX, circleCenterY);
    mohrCtx.lineTo(pointDX, pointDY);
    mohrCtx.strokeStyle = '#9b59b6';
    mohrCtx.lineWidth = 2;
    mohrCtx.setLineDash([]);
    mohrCtx.stroke();
}

// 计算合适的网格步长
function calculateGridStep(range) {
    const niceSteps = [10, 20, 40, 50, 100, 150, 200];
    const roughStep = range / 8;
    
    for (let i = 0; i < niceSteps.length; i++) {
        if (niceSteps[i] >= roughStep) {
            return niceSteps[i];
        }
    }
    
    return Math.ceil(roughStep / 100) * 100;
}

// 绘制箭头函数
function drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth = 2) {
    const headlen = 8 + lineWidth;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI/6), toY - headlen * Math.sin(angle - Math.PI/6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI/6), toY - headlen * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    
    const arrowGradient = ctx.createLinearGradient(
        toX, toY,
        toX - headlen * Math.cos(angle), toY - headlen * Math.sin(angle)
    );
    arrowGradient.addColorStop(0, color);
    arrowGradient.addColorStop(1, color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
    ctx.fillStyle = arrowGradient;
    ctx.fill();
}

// 更新计算步骤显示
function updateCalculationSteps(sigmaX, sigmaY, tauXY, theta, results) {
    const { avg, R, sigmaTheta, tauTheta, sigmaMax, sigmaMin, thetaP } = results;
    
    const thetaRad = theta * Math.PI / 180;
    const cos2Theta = Math.cos(2 * thetaRad);
    const sin2Theta = Math.sin(2 * thetaRad);
    
    const sigmaDiffHalf = (sigmaX - sigmaY) / 2;
    const sigmaSumHalf = (sigmaX + sigmaY) / 2;
    
    // 更新步骤1
    step1El.textContent = `σm = (σₓ + σᵧ)/2 = (${sigmaX.toFixed(1)} + ${sigmaY.toFixed(1)})/2 = ${avg.toFixed(2)} MPa`;
    
    // 更新步骤2
    step2El.textContent = `R = √[((σₓ-σᵧ)/2)² + τₓᵧ²] = √[(((${sigmaX.toFixed(1)}-${sigmaY.toFixed(1)})/2)² + ${tauXY.toFixed(1)}²] = √[${sigmaDiffHalf.toFixed(1)}² + ${tauXY.toFixed(1)}²] = ${R.toFixed(2)} MPa`;
    
    // 更新步骤3
    const term1 = sigmaSumHalf;
    const term2 = sigmaDiffHalf * cos2Theta;
    const term3 = tauXY * sin2Theta;
    
    step3El.textContent = `σθ = (σₓ+σᵧ)/2 + (σₓ-σᵧ)/2·cos2θ - τₓᵧ·sin2θ = ${sigmaSumHalf.toFixed(1)} + ${sigmaDiffHalf.toFixed(1)}·${cos2Theta.toFixed(3)} - ${tauXY.toFixed(1)}·${sin2Theta.toFixed(3)} = ${term1.toFixed(1)} + ${term2.toFixed(1)} - ${term3.toFixed(1)} = ${sigmaTheta.toFixed(2)} MPa`;
    
    // 更新步骤4
    const term4 = sigmaDiffHalf * sin2Theta;
    const term5 = tauXY * cos2Theta;
    step4El.textContent = `τθ = (σₓ-σᵧ)/2·sin2θ + τₓᵧ·cos2θ = ${sigmaDiffHalf.toFixed(1)}·${sin2Theta.toFixed(3)} + ${tauXY.toFixed(1)}·${cos2Theta.toFixed(3)} = ${term4.toFixed(2)} + ${term5.toFixed(2)} = ${tauTheta.toFixed(2)} MPa`;
    
    // 更新步骤5
    step5El.textContent = `σmax = σm + R = ${avg.toFixed(1)} + ${R.toFixed(2)} = ${sigmaMax.toFixed(2)} MPa, σmin = σm - R = ${avg.toFixed(1)} - ${R.toFixed(2)} = ${sigmaMin.toFixed(2)} MPa`;
}

// 计算并绘制
function calculateAndDraw() {
    // 计算应力
    const results = calculateStress(sigmaX, sigmaY, tauXY, theta);
    const { sigmaTheta, tauTheta, sigmaMax, sigmaMin, avg, R, tauMax, thetaP } = results;
    
    // 更新结果显示
    sigmaThetaEl.textContent = `${sigmaTheta.toFixed(2)} MPa`;
    tauThetaEl.textContent = `${tauTheta.toFixed(2)} MPa`;
    sigmaMaxEl.textContent = `${sigmaMax.toFixed(2)} MPa`;
    sigmaMinEl.textContent = `${sigmaMin.toFixed(2)} MPa`;
    tauMaxEl.textContent = `${tauMax.toFixed(2)} MPa`;
    thetaPEl.textContent = `${thetaP.toFixed(2)} °`;
    
    // 更新计算步骤
    updateCalculationSteps(sigmaX, sigmaY, tauXY, theta, results);
    
    // 绘制单元体
    drawElement(sigmaX, sigmaY, tauXY, theta, sigmaTheta, tauTheta);
    
    // 绘制莫尔应力圆
    drawMohrCircle(sigmaX, sigmaY, tauXY, theta, sigmaTheta, tauTheta, sigmaMax, sigmaMin, avg, R);
}



// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化计算和绘制
    calculateAndDraw();
    
    // 确保角度显示正确
    angleValue.textContent = theta.toFixed(1);
    
    // 初始化预设按钮状态
    updatePresetButtonState();
});
