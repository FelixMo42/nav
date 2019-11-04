precision mediump float;

uniform float vpw; // Width, in pixels
uniform float vph; // Height, in pixels

uniform vec2 offset; // e.g. [-0.023500000000000434 0.9794000000000017], currently the same as the x/y offset in the mvMatrix
uniform vec2 pitch;  // e.g. [50 50]
uniform int lineWidth; 

varying vec2 vTextureCoord;//The coordinates of the current pixel
uniform sampler2D uSampler;//The image data

void main() {
    float offX = offset.x + gl_FragCoord.x;
    float offY = offset.y + gl_FragCoord.y;

    if ( int(mod(offX, pitch.x)) < lineWidth || int(mod(offY, pitch.y)) < lineWidth ) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        gl_FragColor = texture2D(uSampler, vTextureCoord);   
    }
}