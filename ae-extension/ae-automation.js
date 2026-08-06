// After Effects Automation Script for Subbly AI Panel
// Runs inside the After Effects UXP Scripting context

function hexToRGB(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b, 1];
}

function importCaptionsToAE(captions, styleParams, onProgress) {
  try {
    const ae = require("aftereffects");
    const app = ae.app;
    const activeComp = app.project.activeItem;

    if (!activeComp || activeComp.typeName !== "Composition") {
      throw new Error("No active composition found. Please select or open a composition first.");
    }

    // Begin Undo Group
    app.beginUndoGroup("Import Subbly AI Captions");

    // Clean existing Subbly layers to support re-import/update
    const layersToRemove = [];
    for (let i = 1; i <= activeComp.numLayers; i++) {
      const layer = activeComp.layer(i);
      if (layer.name && layer.name.indexOf("[Subbly]") === 0) {
        layersToRemove.push(layer);
      }
    }
    layersToRemove.forEach(layer => {
      layer.remove();
    });

    const compWidth = activeComp.width;
    const compHeight = activeComp.height;

    // Calculate Y position based on preset
    let targetY = compHeight * 0.82; // Bottom lower-third default
    if (styleParams.position === "top") {
      targetY = compHeight * 0.15;
    } else if (styleParams.position === "middle") {
      targetY = compHeight * 0.5;
    }

    const totalCaptions = captions.length;

    // Iterate and build layers
    for (let idx = 0; idx < totalCaptions; idx++) {
      const caption = captions[idx];
      const layerName = `[Subbly] Caption ${idx + 1}`;
      
      // Add text layer
      const textLayer = activeComp.layers.addText(caption.text);
      textLayer.name = layerName;
      
      // Set timing
      textLayer.inPoint = caption.start;
      textLayer.outPoint = caption.end;

      // Access Source Text property and text document structure
      const sourceTextProp = textLayer.property("Source Text");
      const textDocument = sourceTextProp.value;

      // Set Font and Typography
      textDocument.font = styleParams.font || "Inter";
      textDocument.fontSize = styleParams.fontSize || 60;
      textDocument.fillColor = hexToRGB(styleParams.color || "#ffffff").slice(0, 3);
      textDocument.applyFill = true;

      // Set Stroke
      if (styleParams.strokeWidth && styleParams.strokeWidth > 0) {
        textDocument.strokeWidth = styleParams.strokeWidth;
        textDocument.strokeColor = hexToRGB(styleParams.strokeColor || "#000000").slice(0, 3);
        textDocument.applyStroke = true;
        textDocument.strokeOverFill = false;
      } else {
        textDocument.applyStroke = false;
      }

      // Set Alignment to Center
      textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;

      // Commit changes to Source Text
      sourceTextProp.setValue(textDocument);

      // Set layer center coordinates
      textLayer.property("Position").setValue([compWidth / 2, targetY]);

      // Apply Animations
      const animType = styleParams.animation;
      
      // 1. Pop In Scale Animation (Overshoot scaling expression)
      if (animType === "pop") {
        textLayer.property("Scale").expression = `
          t = time - inPoint;
          if (t < 0.15) {
            s = easeOut(t, 0, 0.15, 75, 112);
            s2 = easeIn(t, 0.1, 0.15, 112, 100);
            [s2, s2];
          } else {
            [100, 100];
          }
        `;
      }
      
      // 2. Fade In Animation
      else if (animType === "fade") {
        textLayer.property("Opacity").expression = `
          t = time - inPoint;
          ease(t, 0, 0.2, 0, 100);
        `;
      }
      
      // 3. Slide Up Animation
      else if (animType === "slide-up") {
        textLayer.property("Position").expression = `
          t = time - inPoint;
          yOffset = easeOut(t, 0, 0.25, 60, 0);
          value + [0, yOffset];
        `;
        textLayer.property("Opacity").expression = `
          t = time - inPoint;
          ease(t, 0, 0.2, 0, 100);
        `;
      }
      
      // 4. Word Bounce (For word-by-word emphasis)
      else if (animType === "bounce") {
        textLayer.property("Scale").expression = `
          t = time - inPoint;
          if (t < 0.25) {
            s = Math.sin(t * Math.PI * 4) * 8 * easeOut(t, 0, 0.25, 1, 0);
            [100 + s, 100 + s];
          } else {
            [100, 100];
          }
        `;
      }
      
      // 5. Typewriter Animation (Requires character range selector)
      else if (animType === "typewriter") {
        const textAnimators = textLayer.property("Text").property("Animators");
        const typewriterAnim = textAnimators.addAnimator();
        typewriterAnim.name = "Typewriter";
        
        // Add a Start property to Range Selector
        const selector = typewriterAnim.property("Selectors").addProperty("ADBE Text Range Selector");
        const startProp = selector.property("Start");
        
        // Keyframe the Start property from 0% to 100%
        startProp.setValueAtTime(caption.start, 0);
        startProp.setValueAtTime(caption.end - 0.1, 100);
      }

      // Apply Word-by-Word Highlight (Karaoke style)
      if (styleParams.mode === "word" && caption.words && caption.words.length > 0) {
        const textAnimators = textLayer.property("Text").property("Animators");
        const highlightAnimator = textAnimators.addAnimator();
        highlightAnimator.name = "Word Highlight";

        // Add fill color property to animator
        const fillProp = highlightAnimator.property("Properties").addProperty("ADBE Text Fill Color");
        fillProp.setValue(hexToRGB(styleParams.highlightColor || "#facc15").slice(0, 3));

        // Add expression selector
        const expSelector = highlightAnimator.property("Selectors").addProperty("ADBE Text Express Selector");
        expSelector.name = "Active Word Selector";
        
        // Unit set to "Words" (Based On: 1 = Characters, 2 = Words)
        expSelector.property("Based On").setValue(2);

        // Serialize words array timing for the expression
        const timings = caption.words.map(w => ({
          start: w.start,
          end: w.end
        }));

        // Inject timing values and expression to selector
        expSelector.property("Amount").expression = `
          var wordTimes = ${JSON.stringify(timings)};
          var activeIndex = -1;
          for (var i = 0; i < wordTimes.length; i++) {
            if (time >= wordTimes[i].start && time <= wordTimes[i].end) {
              activeIndex = i;
              break;
            }
          }
          if (textIndex - 1 === activeIndex) 100; else 0;
        `;
      }

      // Notify Progress
      if (onProgress && typeof onProgress === "function") {
        onProgress((idx + 1) / totalCaptions);
      }
    }

    // End Undo Group
    app.endUndoGroup();
    return true;
  } catch (err) {
    console.error("After Effects Caption Scripting Error: ", err);
    return false;
  }
}

// Export module for UXP connection
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    importCaptionsToAE
  };
}
