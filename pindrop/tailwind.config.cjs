/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['src/**/*.{ts,css,html}'],
    output: 'public/globals.css',
    theme: {
        extend: {
            screens: {
                sm: '430px'
            },
            colors: {
                main: '#202225',
                accent: {
                    DEFAULT: '#303134',
                    light: '#87888a'
                },
                hover: '#8b8b8c',
                blue: '#38ACFF'
            },
            fontFamily: {
                main: ['Sara', 'helvetica', 'arial', 'sans-serif']
            },
            transitionProperty: {
                user: 'transform, opacity, height, margin',
                createButton: 'height, width, margin, top, right',
                copy: 'color, transform'
            },
            margin: {
                '1/4': '25%'
            },
            maxHeight: {
                '80vh': '80vh'
            }
        }
    },
    plugins: []
};
