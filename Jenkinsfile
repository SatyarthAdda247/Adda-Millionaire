pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker-central.adda247.com'
        IMAGE_NAME = 'api-partners'
        K8S_CONFIG_REPO = 'https://github.com/metiseduventures/adda-kubernetes-config'
        VALUES_PATH = 'accounts/adda-prod/backend/api-partners/values.yaml'
    }
    
    stages {
        stage('Build') {
            steps {
                script {
                    def buildNumber = "${env.BUILD_NUMBER}"
                    def timestamp = sh(script: 'date +%Y-%m-%d-%H-%M', returnStdout: true).trim()
                    def tag = "${timestamp}-${env.BRANCH_NAME ?: 'main'}"
                    
                    env.IMAGE_TAG = tag
                    env.VERSION = tag
                    
                    sh """
                        docker buildx create --use --name mybuilder || true
                        docker buildx inspect --bootstrap
                        docker buildx build --platform linux/amd64,linux/arm64 \
                            -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${tag} \
                            --push \
                            -f ./Dockerfile .
                    """
                }
            }
        }
        
        stage('Deploy to PROD') {
            options {
                timeout(time: 30, unit: 'MINUTES')
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                script {
                    withCredentials([
                        usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'REPO_CRED', passwordVariable: 'REPO_CRED_PSW'),
                        string(credentialsId: 'argo-password', variable: 'ARGO_CRED_PSW')
                    ]) {
                        sh """
                            # Clone kubernetes config repo
                            rm -rf adda-kubernetes-config
                            git clone https://\${REPO_CRED}@github.com/metiseduventures/adda-kubernetes-config
                            
                            # Update image tag in values.yaml
                            cd adda-kubernetes-config
                            sed -i 's|tagGreen: ".*"|tagGreen: "${env.VERSION}"|' ${VALUES_PATH}
                            
                            # Commit and push changes
                            git config --global user.email "build@adda247.com"
                            git config --global user.name "buildsystem"
                            git add .
                            git commit --allow-empty -m "Update image tag to ${env.VERSION} using build number ${env.VERSION}-${env.BUILD_NUMBER}"
                            git pull origin main
                            git push origin main
                            
                            # Sync ArgoCD
                            argocd --grpc-web login argocd-central.adda247.com --username admin --password \${ARGO_CRED_PSW} --loglevel debug --skip-test-tls
                            argocd --grpc-web app sync api-partners-prod --force
                            argocd --grpc-web app wait api-partners-prod --timeout 600
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "Build and deployment completed successfully"
        }
        failure {
            echo "Build or deployment failed"
        }
        aborted {
            echo "Build or deployment was aborted"
        }
    }
}
